import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const count = await prisma.notificacaoUsuario.count({
      where: {
        usuario_id: event.context.auth.id,
        lida: false,
      },
    });

    return {
      count,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao contar notificações não lidas",
    });
  }
});
