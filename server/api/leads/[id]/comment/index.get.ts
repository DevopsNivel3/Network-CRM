import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const leadCommentsQuerySchema = z.object({
  page: pageSchema,
  perPage: perPageSchema.default("5"),
});

// Rota para buscar comentários de um Lead (paginado)
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const query = await getValidatedQuery(
      event,
      leadCommentsQuerySchema.parseAsync,
    );

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    const whereLead: Prisma.LeadWhereUniqueInput = { id };
    if (!isGrantAdmin) whereLead.empresa_id = event.context.auth.empresa_id;
    if (!isAdmin && !isGrantAdmin) whereLead.usuario_id = event.context.auth.id;

    const lead = await prisma.lead.findUnique({
      where: whereLead,
      select: { id: true },
    });

    if (!lead) throw new Error("Lead não encontrado");

    const where: Prisma.LeadComentariosWhereInput = {
      lead_id: id,
    };

    const total = await prisma.leadComentarios.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.leadComentarios.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select: {
        id: true,
        descricao: true,
        criado: true,
        atualizado: true,
        anexos: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        criado: "desc",
      },
    });

    await logger.view(event, JSON.stringify(data));

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar os comentários",
    });
  }
});
