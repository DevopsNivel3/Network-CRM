import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
    const empresaId = event.context.auth.empresa_id;

    await prisma.whatsappTemplate.delete({
      where: { id, empresa_id: empresaId },
    });

    return true;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao remover template do WhatsApp",
    });
  }
});
