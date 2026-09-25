import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para buscar os dados de perfil do usuário autenticado
export default defineEventHandler(async (event) => {
  try {
    const where: Prisma.UsuarioWhereUniqueInput = {
      id: event.context.auth.id,
      empresa_id: event.context.auth.empresa_id,
    };

    const data = await prisma.usuario.findUnique({
      where,
      select: {
        id: true,
        nome: true,
        contato: true,
        email: true,
        avatar: true,
        criado: true,
        atualizado: true,
      },
    });

    if (!data) throw new Error("Usuário não encontrado");

    await logger.view(event, JSON.stringify(data));

    return data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar o perfil",
    });
  }
});
