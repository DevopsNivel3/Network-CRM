import prisma from "@/lib/prisma";
import { z } from "zod";

const cidadesQuerySchema = z.object({
  estado: z.string().optional(),
  name: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para buscar as cidades de um estado
export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(event, cidadesQuerySchema.parseAsync);

    const estado = await prisma.estado.findFirst({
      where: {
        nome: query.estado,
      },
      select: {
        cidades: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    const formattedCidades = estado!.cidades.map((cidade) => ({
      value: cidade.nome,
      label: cidade.nome,
      id: cidade.id,
    }));

    return formattedCidades;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar as cidades",
    });
  }
});
