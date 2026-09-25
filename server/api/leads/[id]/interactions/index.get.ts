import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const db = prisma as any;
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.LEAD_VIEW))
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
    const query = await getValidatedQuery(event, leadInteractionsQuerySchema.parseAsync);
    const whereLead: Prisma.LeadWhereUniqueInput = { id };

    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      whereLead.usuario_id = event.context.auth.id;
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN))
      whereLead.empresa_id = event.context.auth.empresa_id;

    const lead = await prisma.lead.findUnique({
      where: whereLead,
      select: { id: true },
    });
    if (!lead) throw new Error("Lead não encontrado");

    const where: any = { lead_id: lead.id };
    const total = await db.leadInteracao.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await db.leadInteracao.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      orderBy: { criado: "desc" },
      select: {
        id: true,
        tipo: true,
        descricao: true,
        origem: true,
        criado: true,
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao listar interações do lead",
    });
  }
});

