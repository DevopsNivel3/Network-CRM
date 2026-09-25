import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para buscar os responsáveis de uma oportunidade
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
    const where: Prisma.OportunidadeResponsaveisWhereInput = {
      oportunidade_id: id,
    };
    const canManageResponsaveis =
      hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN) ||
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GERENCIAR_RESPONSAVEIS,
      ) ||
      !!(await prisma.oportunidadeResponsaveis.findFirst({
        where: {
          oportunidade_id: id,
          usuario_id: event.context.auth.id,
          gerencia_responsaveis: true,
        },
        select: { id: true },
      }));

    if (!canManageResponsaveis)
      where.usuario_id = event.context.auth.id;
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.ADMIN,
      )
    )
      where.oportunidade = {
        lead: { empresa_id: event.context.auth.empresa_id },
      };

    const data = await prisma.oportunidadeResponsaveis.findMany({
      where,
      select: {
        criado: true,
        principal: true,
        gerencia_responsaveis: true,
        pode_editar: true,
        pode_interacoes: true,
        pode_visitas: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        criado: "desc",
      },
    });

    const total = data.length;

    await logger.view(event, JSON.stringify(data));

    return { total, data };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message:
        err?.message || "Ocorreu um erro ao os responsáveis da Oportunidade",
    });
  }
});
