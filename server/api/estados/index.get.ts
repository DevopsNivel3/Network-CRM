import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const estadosQuerySchema = z.object({
  name: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para buscar todas as estados
export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(event, estadosQuerySchema.parseAsync);
    const where: Prisma.EstadoWhereInput = {};

    if (query.name) {
      where.nome = {
        contains: query.name,
      };
    }

    const total = await prisma.estado.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.estado.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select: {
        id: true,
        nome: true,
      },
    });

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar todos os estados",
    });
  }
});
