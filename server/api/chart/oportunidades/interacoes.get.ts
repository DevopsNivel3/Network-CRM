import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
dayjs.extend(isSameOrBefore);
import dayjs from "dayjs";
import { z } from "zod";

const chartInteracoesQuerySchema = z.object({
  userId: z.union([z.string(), z.number()]).default("all"),
  groupIds: z
    .union([z.string(), z.array(z.string()), z.number(), z.array(z.number())])
    .optional(),
  name: z.string().optional(),
  status: createNumberSchema("Status").nullable().optional(),
  range: z.string().optional(),
  city: z.string().default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

const parseGroupIds = (value: unknown): number[] => {
  if (value === undefined || value === null || value === "") return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((item) => String(item).split(","))
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num > 0);
};

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_OPORTUNIDADE,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const getTipoInteracao = (tipo: number): string => {
      const tipos: Record<number, string> = {
        1: "MENSAGEM",
        2: "EMAIL",
        3: "TELEFONE",
      };
      return tipos[tipo] || `Tipo ${tipo}`;
    };

    const query = await getValidatedQuery(
      event,
      chartInteracoesQuerySchema.parseAsync,
    );
    const where: Prisma.OportunidadeWhereInput = {
      lead: { empresa: {} },
      desativado: false,
    };
    const groupIds = parseGroupIds(query.groupIds);

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) {
      where.usuario = { empresa_id: event.context.auth.empresa_id };
    }

    if (!isAdmin && !isGrantAdmin) {
      where.responsaveis = { some: { usuario_id: event.context.auth.id } };
    }

    if (query.userId !== "all" && !isNaN(Number(query.userId))) {
      if (isGrantAdmin || isAdmin) {
        where.usuario_id = Number(query.userId);
      }
    }

    if (query.city !== "all") {
      where.lead = where.lead || {};
      where.lead.localizacoes = {
        some: {
          cidade: { equals: query.city },
        },
      };
    }

    if (groupIds.length) {
      where.lead = where.lead || {};
      where.lead.grupos = {
        some: {
          grupo_id: { in: groupIds },
        },
      };
    }

    if (query.name) {
      const nameOr: Prisma.OportunidadeWhereInput[] = [
        {
          lead: {
            nome_lead: { contains: query.name },
          },
        },
        {
          lead: {
            contato: { contains: query.name },
          },
        },
      ];

      if (where.OR) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { OR: where.OR },
          { OR: nameOr },
        ];
        delete where.OR;
      } else {
        where.OR = nameOr;
      }
    }

    const interacoes = await prisma.oportunidadeInteracoes.findMany({
      where: {
        oportunidade: { ...where },
        ...((query.startDate || query.endDate) && {
          data: {
            ...(query.startDate && {
              gte: new Date(new Date(query.startDate).setUTCHours(3, 0, 0, 0)),
            }),
            ...(query.endDate && {
              lte: new Date(
                new Date(query.endDate).setUTCHours(26, 59, 59, 999),
              ),
            }),
          },
        }),
      },
      select: {
        tipo: true,
        status: true,
        statusInt: true,
        data: true,
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        data: "asc",
      },
    });

    const interacoesPorUsuarioTipo: Record<string, Record<string, number>> = {};
    const interacoesPorTipo: Record<string, number> = {};
    const interacoesPorData: Record<string, number> = {};
    const interacoesPorDataTipo: Record<string, Record<string, number>> = {};

    for (const item of interacoes) {
      const usuario = item.usuario?.nome ?? "Usuário Desconhecido";
      const tipo = item.tipo ?? "Desconhecido";
      const tipoString = getTipoInteracao(parseInt(tipo.toString()));
      const data = item.data.toISOString().split("T")[0];

      if (!interacoesPorUsuarioTipo[usuario])
        interacoesPorUsuarioTipo[usuario] = {};
      interacoesPorUsuarioTipo[usuario][tipo] =
        (interacoesPorUsuarioTipo[usuario][tipo] || 0) + 1;

      interacoesPorTipo[tipo] = (interacoesPorTipo[tipo] || 0) + 1;
      interacoesPorData[data] = (interacoesPorData[data] || 0) + 1;

      if (!interacoesPorDataTipo[data]) interacoesPorDataTipo[data] = {};
      interacoesPorDataTipo[data][tipoString] =
        (interacoesPorDataTipo[data][tipoString] || 0) + 1;
    }

    const totalPorUsuario: Record<string, number> = {};
    for (const usuario in interacoesPorUsuarioTipo)
      totalPorUsuario[usuario] = Object.values(
        interacoesPorUsuarioTipo[usuario],
      ).reduce((sum, count) => sum + count, 0);

    const top3Usuarios = Object.entries(totalPorUsuario)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([usuario]) => usuario);

    const tiposUnicos = [
      ...new Set(
        Object.values(interacoesPorUsuarioTipo).flatMap((tipos) =>
          Object.keys(tipos),
        ),
      ),
    ];

    const interacoesDataPorUsuario = {
      categories: top3Usuarios,
      series: tiposUnicos.map((tipo) => ({
        name: getTipoInteracao(parseInt(tipo)),
        data: top3Usuarios.map(
          (usuario) => interacoesPorUsuarioTipo[usuario]?.[tipo] || 0,
        ),
      })),
    };

    const interacoesDataPorTipo = Object.entries(interacoesPorTipo).map(
      ([tipo, count]) => ({
        name: getTipoInteracao(parseInt(tipo)),
        value: count,
      }),
    );

    const startDate = query.startDate
      ? dayjs(query.startDate)
      : dayjs("2025-09-01");
    const endDate = query.endDate ? dayjs(query.endDate) : dayjs("2025-09-30");

    const allDates: string[] = [];
    let current = startDate.clone();
    while (current.isSameOrBefore(endDate, "day")) {
      allDates.push(current.format("YYYY-MM-DD"));
      current = current.add(1, "day");
    }

    const groupBy = allDates.length > 31 ? "month" : "day";

    const interacoesDataPorData = {
      categories: [] as string[],
      series: [
        { name: "MENSAGEM", data: [] as number[] },
        { name: "EMAIL", data: [] as number[] },
        { name: "TELEFONE", data: [] as number[] },
      ],
    };

    if (groupBy === "day") {
      for (const data of allDates) {
        const dateLabel = dayjs(data).format("DD/MM");

        interacoesDataPorData.categories.push(dateLabel);
        interacoesDataPorData.series[0].data.push(
          interacoesPorDataTipo[data]?.["MENSAGEM"] || 0,
        ); // MENSAGEM
        interacoesDataPorData.series[1].data.push(
          interacoesPorDataTipo[data]?.["EMAIL"] || 0,
        ); // EMAIL
        interacoesDataPorData.series[2].data.push(
          interacoesPorDataTipo[data]?.["TELEFONE"] || 0,
        ); // TELEFONE
      }
    } else {
      const mesesPorTipo: Record<string, Record<string, number>> = {};

      for (const data of allDates) {
        const mes = data.substring(0, 7); // YYYY-MM

        if (!mesesPorTipo[mes])
          mesesPorTipo[mes] = { MENSAGEM: 0, EMAIL: 0, TELEFONE: 0 };
        if (interacoesPorDataTipo[data]) {
          mesesPorTipo[mes]["MENSAGEM"] +=
            interacoesPorDataTipo[data]["MENSAGEM"] || 0; // MENSAGEM
          mesesPorTipo[mes]["EMAIL"] +=
            interacoesPorDataTipo[data]["EMAIL"] || 0; // EMAIL
          mesesPorTipo[mes]["TELEFONE"] +=
            interacoesPorDataTipo[data]["TELEFONE"] || 0; // TELEFONE
        }
      }

      for (const mes in mesesPorTipo) {
        const monthLabel = dayjs(mes + "-01").format("MMM/YYYY");

        interacoesDataPorData.categories.push(monthLabel);
        interacoesDataPorData.series[0].data.push(
          mesesPorTipo[mes]["MENSAGEM"],
        ); // MENSAGEM
        interacoesDataPorData.series[1].data.push(mesesPorTipo[mes]["EMAIL"]); // EMAIL
        interacoesDataPorData.series[2].data.push(
          mesesPorTipo[mes]["TELEFONE"],
        ); // TELEFONE
      }
    }

    return {
      interacoesPorUsuario: interacoesDataPorUsuario,
      interacoesPorTipo: interacoesDataPorTipo,
      interacoesPorData: interacoesDataPorData,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar os dados do chart",
    });
  }
});
