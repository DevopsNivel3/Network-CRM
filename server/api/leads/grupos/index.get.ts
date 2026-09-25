import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const leadGroupQuerySchema = z.object({
  name: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para buscar grupos de leads
export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(
      event,
      leadGroupQuerySchema.parseAsync,
    );

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );

    const where: Prisma.LeadGrupoWhereInput = {};
    if (!isGrantAdmin) where.empresa_id = event.context.auth.empresa_id;

    if (query.name) {
      where.nome = { contains: query.name };
    }

    const total = await prisma.leadGrupo.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.leadGrupo.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select: {
        id: true,
        nome: true,
        descricao: true,
        criado: true,
        atualizado: true,
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    await logger.view(event, JSON.stringify(data));

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar os grupos",
    });
  }
});
