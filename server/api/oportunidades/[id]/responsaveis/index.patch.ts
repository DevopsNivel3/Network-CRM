import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateResponsavelSchema = z.object({
  user_id: z.number(),
  principal: z.boolean().optional(),
  gerencia_responsaveis: z.boolean().optional(),
  pode_editar: z.boolean().optional(),
  pode_interacoes: z.boolean().optional(),
  pode_visitas: z.boolean().optional(),
});

// Rota para atualizar permissões do responsável
export default defineEventHandler(async (event) => {
  try {
    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      updateResponsavelSchema.parseAsync,
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

    const data: any = {};
    if (typeof body.principal === "boolean") data.principal = body.principal;
    if (typeof body.gerencia_responsaveis === "boolean")
      data.gerencia_responsaveis = body.gerencia_responsaveis;
    if (typeof body.pode_editar === "boolean")
      data.pode_editar = body.pode_editar;
    if (typeof body.pode_interacoes === "boolean")
      data.pode_interacoes = body.pode_interacoes;
    if (typeof body.pode_visitas === "boolean")
      data.pode_visitas = body.pode_visitas;

    if (data.principal === true) {
      data.pode_editar = true;
      data.pode_interacoes = true;
      data.pode_visitas = true;
    }

    if (data.gerencia_responsaveis === true) {
      await prisma.oportunidadeResponsaveis.updateMany({
        where: { oportunidade_id: id },
        data: { gerencia_responsaveis: false },
      });
    }

    if (data.principal === true) {
      await prisma.oportunidadeResponsaveis.updateMany({
        where: { oportunidade_id: id },
        data: { principal: false },
      });
    }

    await prisma.oportunidadeResponsaveis.updateMany({
      where: {
        oportunidade_id: id,
        usuario_id: body.user_id,
      },
      data,
    });

    await logger.update(
      event,
      JSON.stringify({ oportunidade_id: id, user_id: body.user_id, ...data }),
    );

    return { ok: true };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar o responsável",
    });
  }
});
