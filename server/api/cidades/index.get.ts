import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const cidadesQuerySchema = z.object({
  estado: z.string().optional(),
  name: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para buscar todas as cidades
export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(event, cidadesQuerySchema.parseAsync);
    const where: Prisma.CidadeWhereInput = { estado: {} };

    if (query.estado)
      where.estado = {
        nome: query.estado,
      };

    if (query.name) {
      where.nome = {
        contains: query.name,
      };
    }

    const total = await prisma.cidade.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.cidade.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select: {
        id: true,
        nome: true,
        estado: {
          select: {
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
      message: err?.message || "Ocorreu um erro ao buscar todas as cidades",
    });
  }
});
