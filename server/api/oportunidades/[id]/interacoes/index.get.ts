import { Prisma } from "@prisma/client";
import prisma from "~/lib/prisma";
import { z } from "zod";

const oportunidadeInteracoesQuerySchema = z.object({
  tipo: z.string().optional(),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para buscar interações de uma oportunidade
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_OPORTUNIDADE,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const query = await getValidatedQuery(
      event,
      oportunidadeInteracoesQuerySchema.parseAsync,
    );

    const where: Prisma.OportunidadeInteracoesWhereInput = {
      oportunidade_id: id,
    };

    // Filtra por tipo
    if (query.tipo) where.tipo = Number(query.tipo);

    const total = await prisma.oportunidadeInteracoes.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.oportunidadeInteracoes.findMany({
      where: { oportunidade_id: id },
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      orderBy: { data: "desc" },
      select: {
        id: true,
        statusInt: true,
        conteudo: true,
        status: true,
        tipo: true,
        data: true,
        anexos: true,
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
      },
    });

    return { data, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar as interações da oportunidade",
    });
  }
});
