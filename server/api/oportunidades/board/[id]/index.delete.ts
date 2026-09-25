import prisma from "@/lib/prisma";

// Rota para deletar um board na oportunidade
export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);

    const data = await prisma.boardOportunidade.delete({
      where: {
        id,
        empresa_id: event.context.auth.empresa_id,
      },
    });

    await logger.delete(event, JSON.stringify(data));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao deletar o Board",
    });
  }
});
