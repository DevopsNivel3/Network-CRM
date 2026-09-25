import prisma from "@/lib/prisma";

// Rota para deletar um grupo de lead
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.DELETAR_GRUPO,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
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

    await prisma.leadGrupo.delete({
      where: { id },
    });

    await logger.delete(event, JSON.stringify({ id }));

    return { ok: true };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao deletar o grupo",
    });
  }
});
