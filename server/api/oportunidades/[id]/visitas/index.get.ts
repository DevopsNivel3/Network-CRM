import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para buscar visitas de uma oportunidade
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

    const where: Prisma.OportunidadeWhereInput = { id, lead: {} };

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) where.lead!.empresa_id = event.context.auth.empresa_id;
    if (!isAdmin && !isGrantAdmin) {
      where.responsaveis = { some: { usuario_id: event.context.auth.id } };
    }

    const oportunidade = await prisma.oportunidade.findFirst({
      where,
      select: {
        visitas: {
          select: {
            id: true,
            data_fim: true,
            data_inicio: true,
            hora_inicio: true,
            statusInt: true,
          },
          orderBy: [{ data_inicio: "asc" }, { hora_inicio: "asc" }],
        },
      },
    });

    if (!oportunidade) throw new Error("Oportunidade não encontrada");

    return oportunidade.visitas;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar visitas da oportunidade",
    });
  }
});
