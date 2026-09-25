import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const boardCardsQuerySchema = z.object({
  userId: z.union([z.string(), z.number()]).default("all"),
  boardId: z.union([z.string(), z.number()]).optional(),
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
  perPage: perPageSchema.default("25"),
});

const parseGroupIds = (value: unknown): number[] => {
  if (value === undefined || value === null || value === "") return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((item) => String(item).split(","))
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num > 0);
};

// Rota para buscar cards por board (paginado por board)
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
      boardCardsQuerySchema.parseAsync,
    );
    const groupIds = parseGroupIds(query.groupIds);

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    const baseWhere: Prisma.OportunidadeWhereInput = {
      lead: { empresa: {} },
    };
    if (query.disabledMode === "without") baseWhere.desativado = false;
    if (query.disabledMode === "only") baseWhere.desativado = true;

    if (!isGrantAdmin) {
      baseWhere.usuario = { empresa_id: event.context.auth.empresa_id };
    }

    if (!isAdmin && !isGrantAdmin) {
      baseWhere.responsaveis = {
        some: { usuario_id: Number(event.context.auth.id) },
      };
    }

    if (query.userId !== "all" && !isNaN(Number(query.userId))) {
      if (isGrantAdmin || isAdmin) {
        baseWhere.responsaveis = {
          some: { usuario_id: Number(query.userId) },
        };
      }
    }

    if (query.status) baseWhere.statusInt = query.status;
    if (query.range) baseWhere.faixa_valor = query.range;
    if (groupIds.length) {
      baseWhere.lead = baseWhere.lead || {};
      baseWhere.lead.grupos = {
        some: {
          grupo_id: { in: groupIds },
        },
      };
    }

    if (query.city !== "all") {
      baseWhere.lead = baseWhere.lead || {};
      baseWhere.lead.localizacoes = baseWhere.lead.localizacoes || {};
      baseWhere.lead.localizacoes.some = {
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

      if (baseWhere.OR) {
        baseWhere.AND = [
          ...(Array.isArray(baseWhere.AND) ? baseWhere.AND : []),
          { OR: baseWhere.OR },
          { OR: nameOr },
        ];
        delete baseWhere.OR;
      } else {
        baseWhere.OR = nameOr;
      }
    }

    const isValidDate = (d: string | undefined): boolean => {
      return !!d && !isNaN(new Date(d).getTime());
    };

    const hasValidStart = isValidDate(query.startDate);
    const hasValidEnd = isValidDate(query.endDate);

    if (hasValidStart || hasValidEnd) {
      baseWhere.criado = {
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
      baseWhere.interacoes = {
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

    const allBoards = await prisma.boardOportunidade.findMany({
      where: isGrantAdmin
        ? undefined
        : {
            empresa_id: event.context.auth.empresa_id,
          },
      select: {
        id: true,
        titulo: true,
        posicao: true,
        cor: true,
      },
      orderBy: { posicao: "asc" },
    });

    let boards = allBoards;
    if (query.boardId && !isNaN(Number(query.boardId))) {
      const boardId = Number(query.boardId);
      boards = allBoards.filter((b) => b.id === boardId);
    }

    if (!boards.length)
      return {
        boards: [],
        page: query.page,
        perBoard: query.perPage,
        hasMore: false,
        total: 0,
        boardId: query.boardId ? Number(query.boardId) : undefined,
      };

    const firstBoardId = allBoards[0]?.id;
    const perBoard = query.perPage;
    const skip = (query.page - 1) * perBoard;

    const results = await Promise.all(
      boards.map(async (board) => {
        const boardCondition: Prisma.OportunidadeWhereInput =
          board.id === firstBoardId
            ? { OR: [{ board_id: board.id }, { board_id: null }] }
            : { board_id: board.id };

        const where: Prisma.OportunidadeWhereInput = {
          AND: [baseWhere, boardCondition],
        };

        const total = await prisma.oportunidade.count({ where });
        const items = await prisma.oportunidade.findMany({
          where,
          skip,
          take: perBoard,
          orderBy: [{ posicao: "asc" }, { id: "asc" }],
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

        return {
          board_id: board.id,
          total,
          hasMore: skip + items.length < total,
          items,
        };
      }),
    );

    const allItems = results.flatMap((r) => r.items);
    const ids = allItems.map((item) => item.id);
    if (ids.length) {
      const [currentResp, reasonHistory] = await Promise.all([
        prisma.oportunidadeResponsaveis.findMany({
          where: {
            oportunidade_id: { in: ids },
            usuario_id: event.context.auth.id,
          },
          select: { oportunidade_id: true, principal: true, pode_editar: true },
        }),
        prisma.oportunidadeHistorico.findMany({
          where: {
            oportunidade_id: { in: ids },
            board_id: { not: null },
            motivo: { not: null },
          },
          orderBy: [{ criado: "desc" }, { id: "desc" }],
          select: {
            oportunidade_id: true,
            board_id: true,
            motivo: true,
            motivo_observacao: true,
            criado: true,
          },
        }),
      ]);
      const map = new Map(currentResp.map((r) => [r.oportunidade_id, r]));
      const itemById = new Map(allItems.map((item) => [item.id, item]));
      const reasonMap = new Map<number, (typeof reasonHistory)[number]>();
      reasonHistory.forEach((history) => {
        const item = itemById.get(history.oportunidade_id);
        if (
          item?.board_id === history.board_id &&
          !reasonMap.has(history.oportunidade_id)
        ) {
          reasonMap.set(history.oportunidade_id, history);
        }
      });
      allItems.forEach((item) => {
        (item as any).responsavel_atual = map.get(item.id) || null;
        (item as any).motivo_atual = reasonMap.get(item.id) || null;
      });
    }

    const total = query.boardId
      ? undefined
      : results.reduce((sum, r) => sum + r.total, 0);
    const hasMore = query.boardId
      ? (results[0]?.hasMore ?? false)
      : results.some((r) => r.hasMore);

    return {
      boards: results,
      page: query.page,
      perBoard,
      hasMore,
      total,
      boardId: query.boardId ? Number(query.boardId) : undefined,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar as oportunidades",
    });
  }
});
