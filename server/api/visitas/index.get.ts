import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const visitasQuerySchema = z.object({
  name: z.string().optional(),
  opportunityId: createNumberSchema("Oportunidade").nullable().optional(),
  boardId: createNumberSchema("Board").nullable().optional(),
  status: createNumberSchema("Status").nullable().optional(),
  city: z.string().default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para retornar todas as visitas
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_VISITA,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const query = await getValidatedQuery(event, visitasQuerySchema.parseAsync);
    const where: Prisma.VisitaWhereInput = { oportunidade: { lead: {} } };

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) {
      where.oportunidade!.lead!.empresa_id = event.context.auth.empresa_id;
    }

    if (!isAdmin && !isGrantAdmin) {
      where.usuario_id = event.context.auth.id;
    }

    if (query.status !== null) where.statusInt = query.status;
    if (query.boardId) where.oportunidade!.board_id = query.boardId;
    if (query.opportunityId) where.oportunidade_id = query.opportunityId;
    if (query.name) {
      where.oportunidade!.lead!.OR = [
        { nome_lead: { contains: query.name } },
        { contato: { contains: query.name } },
        { cpf_cnpj: { contains: query.name } },
      ];
    }

    if (query.city !== "all") {
      where.localizacao = {
        cidade: { equals: query.city },
      };
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

    const total = await prisma.visita.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.visita.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select: {
        id: true,
        data_inicio: true,
        hora_inicio: true,
        data_fim: true,
        statusInt: true,
        localizacao: {
          select: {
            cidade: true,
            estado: true,
          },
        },
        oportunidade: {
          select: {
            id: true,
            lead: {
              select: {
                nome_lead: true,
              },
            },
          },
        },
      },
    });

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar todas as visitas",
    });
  }
});
