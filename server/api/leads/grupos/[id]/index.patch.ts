import prisma from "@/lib/prisma";
import { z } from "zod";

const updateLeadGroupBodySchema = z.object({
  nome: z.string().optional(),
  descricao: z.string().nullable().optional(),
});

// Rota para atualizar um grupo de lead
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.EDITAR_GRUPO,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      updateLeadGroupBodySchema.parseAsync,
    );

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );

    const existing = await prisma.leadGrupo.findFirst({
      where: {
        id,
        ...(isGrantAdmin ? {} : { empresa_id: event.context.auth.empresa_id }),
      },
      select: { id: true },
    });

    if (!existing) throw new Error("Grupo não encontrado");

    const data = await prisma.leadGrupo.update({
      where: { id },
      data: {
        ...(body.nome !== undefined && { nome: body.nome }),
        ...(body.descricao !== undefined && { descricao: body.descricao }),
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

    await logger.update(event, JSON.stringify(data));

    return data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar o grupo",
    });
  }
});
