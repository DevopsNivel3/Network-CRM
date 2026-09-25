import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.VER_LEAD))
      throw new Error("Você não tem permissão suficiente");

    const empresaId = event.context.auth.empresa_id;

    const templates = await prisma.whatsappTemplate.findMany({
      where: { empresa_id: empresaId },
      orderBy: { atualizado: "desc" },
    });

    return templates;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar templates do WhatsApp",
    });
  }
});
