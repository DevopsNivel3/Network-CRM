import prisma from "@/lib/prisma";

// Rota para buscar todos os boards da empresa
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_OPORTUNIDADE,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const boards = await prisma.boardOportunidade.findMany({
      where: hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
        ? undefined
        : {
            empresa_id: event.context.auth.empresa_id,
          },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        cor: true,
        qualificacao: true,
        posicao: true,
        controle_lembretes: true,
        exige_motivo: true,
        grupo_motivos: true,
        motivos: true,
        exigir_obs_outro: true,
        usuario_atribuido_id: true,
        usuario_atribuido: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        posicao: "asc",
      },
    });

    return boards;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar todos os boards",
    });
  }
});
