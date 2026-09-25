import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { notifyOpportunityAssignment } from "@/server/utils/opportunity-notifications";
import { z } from "zod";

const addResponsaveisBodySchema = z.object({
  user_ids: z.array(z.number()).min(1, "Selecione ao menos um usuário"),
  pode_editar: z.boolean().optional(),
  pode_interacoes: z.boolean().optional(),
  pode_visitas: z.boolean().optional(),
});

// Rota para adicionar responsáveis a uma oportunidade
export default defineEventHandler(async (event) => {
  try {
    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      addResponsaveisBodySchema.parseAsync,
    );

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id },
      select: {
        id: true,
        lead: { select: { empresa_id: true } },
        responsaveis: {
          where: { usuario_id: event.context.auth.id },
          select: {
            principal: true,
            gerencia_responsaveis: true,
            pode_editar: true,
          },
          take: 1,
        },
      },
    });
    if (!oportunidade) throw new Error("Oportunidade não encontrada");
    if (
      !isGrantAdmin &&
      oportunidade.lead.empresa_id !== event.context.auth.empresa_id
    )
      throw new Error("Oportunidade não encontrada");

    const responsavelAtual = oportunidade.responsaveis[0];
    const canManage =
      isAdmin ||
      isGrantAdmin ||
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GERENCIAR_RESPONSAVEIS,
      ) ||
      !!responsavelAtual?.gerencia_responsaveis;
    if (!canManage) throw new Error("Você não tem permissão suficiente");

    const usuariosValidos = await prisma.usuario.findMany({
      where: {
        id: { in: body.user_ids },
        ...(hasUserPermission(
          event.context.auth.permissoes,
          UserPermissions.ADMIN,
        )
          ? {}
          : { empresa_id: event.context.auth.empresa_id }),
        desativado: false,
      },
      select: { id: true },
    });

    const validUserIds = usuariosValidos.map((u) => u.id);
    if (!validUserIds.length)
      throw new Error("Nenhum usuário válido encontrado");

    const existentes = await prisma.oportunidadeResponsaveis.findMany({
      where: { oportunidade_id: id, usuario_id: { in: validUserIds } },
      select: { usuario_id: true },
    });
    const existentesSet = new Set(existentes.map((r) => r.usuario_id));

    const toCreate = validUserIds.filter(
      (userId) => !existentesSet.has(userId),
    );
    if (toCreate.length) {
      await prisma.oportunidadeResponsaveis.createMany({
        data: toCreate.map((userId) => ({
          oportunidade_id: id,
          usuario_id: userId,
          gerencia_responsaveis: false,
          pode_editar: body.pode_editar ?? false,
          pode_interacoes: body.pode_interacoes ?? false,
          pode_visitas: body.pode_visitas ?? false,
        })),
      });

      await notifyOpportunityAssignment(prisma, {
        oportunidadeId: id,
        actorUserId: event.context.auth.id,
        assignedUserIds: toCreate,
        source: "manual",
      });
    }

    await logger.update(
      event,
      JSON.stringify({ oportunidade_id: id, added: toCreate }),
    );

    let createdMap: Record<number, string> = {};
    if (toCreate.length) {
      const createdRows = await prisma.oportunidadeResponsaveis.findMany({
        where: { oportunidade_id: id, usuario_id: { in: toCreate } },
        select: { usuario_id: true, criado: true },
      });
      createdMap = Object.fromEntries(
        createdRows.map((row) => [row.usuario_id, row.criado.toISOString()]),
      );
    }

    return { added: toCreate, created: createdMap };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao adicionar responsáveis",
    });
  }
});
