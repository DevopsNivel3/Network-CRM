import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const removeResponsaveisBodySchema = z.object({
  user_ids: z.array(z.number()).min(1, "Selecione ao menos um usuário"),
});

// Rota para remover responsáveis de uma oportunidade
export default defineEventHandler(async (event) => {
  try {
    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      removeResponsaveisBodySchema.parseAsync,
    );

    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id },
      select: {
        id: true,
        lead: { select: { empresa_id: true } },
        responsaveis: {
          where: { usuario_id: event.context.auth.id },
          select: { gerencia_responsaveis: true },
          take: 1,
        },
      },
    });
    if (!oportunidade) throw new Error("Oportunidade não encontrada");
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN) &&
      oportunidade.lead.empresa_id !== event.context.auth.empresa_id
    )
      throw new Error("Oportunidade não encontrada");

    const canManage =
      hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN) ||
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      ) ||
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GERENCIAR_RESPONSAVEIS,
      ) ||
      !!oportunidade.responsaveis[0]?.gerencia_responsaveis;
    if (!canManage) throw new Error("Você não tem permissão suficiente");

    let userIds = body.user_ids;
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    ) {
      userIds = userIds.filter((uid) => uid !== event.context.auth.id);
    }
    if (!userIds.length) return { removed: [], count: 0 };

    const deleteWhere: Prisma.OportunidadeResponsaveisWhereInput = {
      oportunidade_id: id,
      usuario_id: { in: userIds },
    };

    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.ADMIN,
      )
    ) {
      deleteWhere.usuario = { empresa_id: event.context.auth.empresa_id };
    }

    const deleted = await prisma.oportunidadeResponsaveis.deleteMany({
      where: deleteWhere,
    });

    await logger.update(
      event,
      JSON.stringify({ oportunidade_id: id, removed: userIds }),
    );

    return { removed: userIds, count: deleted.count };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao remover responsáveis",
    });
  }
});
