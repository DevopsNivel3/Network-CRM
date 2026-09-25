import prisma from "@/lib/prisma";

// Rota para buscar uma Empresa pelo ID
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );

    const data = await prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        grupo: true,
        contato: true,
        email: true,
        desativado: true,
        modulos: true,
        criado: true,
        atualizado: true,
        usuario_id: true,
        _count: {
          select: {
            usuarios: true,
            leads: true,
          },
        },
      },
    });

    return data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar a Empresa",
    });
  }
});
