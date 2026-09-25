import prisma from "@/lib/prisma";
import { z } from "zod";

const createLeadGroupBodySchema = z.object({
  nome: createStringSchema("Nome"),
  descricao: z.string().nullable().optional(),
});

// Rota para criar um grupo de lead
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.CRIAR_GRUPO,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(
      event,
      createLeadGroupBodySchema.parseAsync,
    );

    const data = await prisma.leadGrupo.create({
      data: {
        nome: body.nome,
        descricao: body.descricao,
        empresa: {
          connect: {
            id: event.context.auth.empresa_id,
          },
        },
        usuario: {
          connect: {
            id: event.context.auth.id,
          },
        },
      },
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
    });

    await logger.create(event, JSON.stringify(data));

    return data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao criar o grupo",
    });
  }
});
