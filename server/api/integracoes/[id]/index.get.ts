import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const id = Number(getRouterParam(event, "id"));
    if (!id) throw new Error("ID inválido");

    const empresaId = event.context.auth.empresa_id;

    const integracao = await prisma.integracao.findFirst({
      where: { id, empresa_id: empresaId },
      select: {
        id: true,
        tipo: true,
        enabled: true,
        config: true,
        criado: true,
        atualizado: true,
      },
    });

    return integracao;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar integração",
    });
  }
});
