import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );

    const interacoes = await prisma.leadInteracao.findMany({
      where: { lead_id: id },
      orderBy: { data_interacao: 'desc' },
      include: {
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
      },
    });

    return interacoes;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar interações do lead",
    });
  }
});