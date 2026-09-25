import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const empresasQuerySchema = z.object({
  name: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para buscar todas as Empresas
export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      throw new Error("Você não tem permissão suficiente");

    const query = await getValidatedQuery(event, empresasQuerySchema.parseAsync);
    const where: Prisma.EmpresaWhereInput = {};

    if (query.name) {
      where.OR = [
        { nome: { contains: query.name } },
        { contato: { contains: query.name } },
        { email: { contains: query.name } },
      ];
    }

    const total = await prisma.empresa.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.empresa.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select: {
        id: true,
        nome: true,
        desativado: true,
      },
    });

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar todas as Empresas",
    });
  }
});
