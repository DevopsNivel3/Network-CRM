import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const chartFunilQuerySchema = z.object({
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

    const query = await getValidatedQuery(
      event,
      chartFunilQuerySchema.parseAsync,
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
        where.responsaveis = { some: { usuario_id: Number(query.userId) } };
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

    if (query.startDate || query.endDate) {
      where.criado = {
        ...(query.startDate && {
          gte: new Date(new Date(query.startDate).setUTCHours(3, 0, 0, 0)),
        }),
        ...(query.endDate && {
          lte: new Date(new Date(query.endDate).setUTCHours(26, 59, 59, 999)),
        }),
      };
    }

    const allBoards = await prisma.boardOportunidade.findMany({
      where: hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
        ? undefined
        : {
            empresa_id: event.context.auth.empresa_id,
          },
      select: {
        id: true,
        titulo: true,
        posicao: true,
        cor: true,
        oportunidades: {
          select: {
            id: true,
            valor_estimado: true,
            criado: true,
            atualizado: true,
            lead: {
              select: {
                id: true,
                nome_lead: true,
                contato: true,
                origem_lead: true,
              },
            },
          },
          where: where,
        },
      },
      orderBy: {
        posicao: "asc",
      },
    });

    const etapasUnicas = new Map();
    allBoards.forEach((board) => {
      etapasUnicas.set(board.id, {
        id: board.id,
        nome: board.titulo,
        posicao: board.posicao,
        cor: board.cor,
        count: board.oportunidades.length,
      });
    });

    const funnelData = Array.from(etapasUnicas.values())
      .sort((a, b) => a.posicao - b.posicao)
      .map((etapa) => ({
        name: etapa.nome,
        value: etapa.count,
        itemStyle: {
          color: etapa.cor,
        },
      }));

    const valor_estimado = allBoards
      .flatMap((board) => board.oportunidades)
      .reduce((acc, oportunidade) => {
        const raw: any = oportunidade?.valor_estimado ?? 0;

        let num = 0;
        if (
          raw &&
          typeof raw === "object" &&
          typeof raw.toNumber === "function"
        ) {
          try {
            num = raw.toNumber();
          } catch {
            num = Number(String(raw)) || 0;
          }
        } else if (typeof raw === "string") {
          const cleaned = raw.replace(/\./g, "").replace(",", ".");
          num = parseFloat(cleaned) || 0;
        } else num = Number(raw) || 0;

        return acc + num;
      }, 0);

    const now = new Date();
    const stuckLeads = [];

    for (const board of allBoards) {
      for (const oportunidade of board.oportunidades) {
        const createdDate = new Date(oportunidade.criado);
        const updatedDate = new Date(oportunidade.atualizado);

        const referenceDate =
          updatedDate > createdDate ? updatedDate : createdDate;
        const daysDiff = Math.floor(
          (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24), // 7 dias
        );

        if (daysDiff > 7) {
          stuckLeads.push({
            id: oportunidade.id,
            lead_id: oportunidade.lead.id,
            lead_name: oportunidade.lead.nome_lead,
            lead_contact: oportunidade.lead.contato,
            board_id: board.id,
            board_name: board.titulo,
            board_cor: board.cor,
            days_stuck: daysDiff,
            created_at: oportunidade.criado,
            updated_at: oportunidade.atualizado,
          });
        }
      }
    }
    const sortedStuckLeads = stuckLeads
      .sort((a, b) => b.days_stuck - a.days_stuck)
      .slice(0, 100);

    // Reutiliza as oportunidades ja carregadas para evitar uma segunda
    // consulta completa apenas para obter a origem dos leads.
    const originsMap = new Map();
    allBoards.flatMap((board) => board.oportunidades).forEach((item) => {
      const origem = item.lead.origem_lead || "Não informado";
      if (!originsMap.has(origem)) originsMap.set(origem, 1);
      else originsMap.set(origem, originsMap.get(origem) + 1);
    });

    const origemLeadData = Array.from(originsMap.entries()).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }),
    );

    return {
      funil: funnelData,
      valor_estimado,
      insights: {
        stuck_leads: sortedStuckLeads,
        total_stuck: stuckLeads.length,
        origem_lead: origemLeadData,
      },
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar os dados do chart",
    });
  }
});
