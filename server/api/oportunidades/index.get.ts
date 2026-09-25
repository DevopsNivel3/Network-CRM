import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const oportunidadesQuerySchema = z.object({
  userId: z.union([z.string(), z.number()]).default("all"),
  groupIds: z
    .union([z.string(), z.array(z.string()), z.number(), z.array(z.number())])
    .optional(),
  name: z.string().optional(),
  status: createNumberSchema("Status").nullable().optional(),
  range: z.string().optional(),
  city: z.string().default("all"),
  disabledMode: z
    .union([z.enum(["without", "with", "only"]), z.string()])
    .default("without")
    .transform((value) => String(value)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interactionStartDate: z.string().optional(),
  interactionEndDate: z.string().optional(),
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

// Rota para buscar todas as Oportunidades
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
      oportunidadesQuerySchema.parseAsync,
    );
    const where: Prisma.OportunidadeWhereInput = { lead: { empresa: {} } };
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

    if (query.disabledMode === "without") where.desativado = false;
    if (query.disabledMode === "only") where.desativado = true;
    if (query.status) where.statusInt = query.status;
    if (query.range) where.faixa_valor = query.range;
    if (groupIds.length) {
      where.lead = where.lead || {};
      where.lead.grupos = {
        some: {
          grupo_id: { in: groupIds },
        },
      };
    }
    if (query.city !== "all") {
      where.lead = where.lead || {};
      where.lead.localizacoes = where.lead.localizacoes || {};
      where.lead.localizacoes.some = {
        cidade: { equals: query.city },
      };
    }
    if (query.name) {
      const nameOr: Prisma.OportunidadeWhereInput[] = [
        {
          lead: {
            nome_lead: {
              contains: query.name,
            },
          },
        },
        {
          lead: {
            contato: {
              contains: query.name,
            },
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

    const isValidDate = (d: string | undefined): boolean => {
      return !!d && !isNaN(new Date(d).getTime());
    };

    const hasValidStart = isValidDate(query.startDate);
    const hasValidEnd = isValidDate(query.endDate);

    if (hasValidStart || hasValidEnd) {
      where.criado = {
        ...(hasValidStart && {
          gte: new Date(new Date(query.startDate!).setUTCHours(3, 0, 0, 0)),
        }),
        ...(hasValidEnd && {
          lte: new Date(new Date(query.endDate!).setUTCHours(26, 59, 59, 999)),
        }),
      };
    }

    const hasValidInteractionStart = isValidDate(query.interactionStartDate);
    const hasValidInteractionEnd = isValidDate(query.interactionEndDate);

    if (hasValidInteractionStart || hasValidInteractionEnd) {
      where.interacoes = {
        some: {
          data: {
            ...(hasValidInteractionStart && {
              gte: new Date(new Date(query.interactionStartDate!).setUTCHours(3, 0, 0, 0)),
            }),
            ...(hasValidInteractionEnd && {
              lte: new Date(new Date(query.interactionEndDate!).setUTCHours(26, 59, 59, 999)),
            }),
          },
        },
      };
    }

    const total = await prisma.oportunidade.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.oportunidade.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select: {
        id: true,
        statusInt: true,
        tipo: true,
        posicao: true,
        criado: true,
        atualizado: true,
        descricao: true,
        desativado: true,
        responsaveis: {
          select: {
            principal: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                avatar: true,
              },
            },
          },
          orderBy: [{ principal: "desc" }, { criado: "desc" }],
          take: 1,
        },
        _count: {
          select: {
            responsaveis: true,
          },
        },
        board_id: true,
        lead: {
          select: {
            nome_lead: true,
            localizacoes: {
              select: {
                id: true,
                numero: true,
                rua: true,
                cidade: true,
                estado: true,
                complemento: true,
                cep: true,
              },
            },
          },
        },
      },
    });

    const ids = data.map((item) => item.id);
    if (ids.length) {
      const currentResp = await prisma.oportunidadeResponsaveis.findMany({
        where: {
          oportunidade_id: { in: ids },
          usuario_id: event.context.auth.id,
        },
        select: { oportunidade_id: true, principal: true, pode_editar: true },
      });
      const map = new Map(currentResp.map((r) => [r.oportunidade_id, r]));
      data.forEach((item) => {
        (item as any).responsavel_atual = map.get(item.id) || null;
      });
    }

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message:
        err?.message || "Ocorreu um erro ao buscar todas as oportunidades",
    });
  }
});
