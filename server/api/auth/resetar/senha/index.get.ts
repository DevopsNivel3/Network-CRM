import prisma from "@/lib/prisma";
import { z } from "zod";

const passwordResetValidateTokenBodySchema = z.object({
  token: createStringSchema("Token"),
});

// Valida o token de recuperação de senha
export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(event, passwordResetValidateTokenBodySchema.parseAsync);

    const tokenExists = await prisma.usuarioSenhaReset.findFirst({
      where: { token: query.token },
      select: { criado: true, usado: true },
    });

    // Verifica se o token existe e se foi criado
    if (!tokenExists || tokenExists.usado)
      throw new Error("Token de recuperação de senha inválido ou expirado.");

    // Verifica se já existe um token de recuperação de senha válido e se ele foi criado há menos de 2 horas
    if (Date.now() - new Date(tokenExists.criado).getTime() > 2 * 60 * 60 * 1000)
      throw new Error("Token de recuperação de senha expirado. Solicite um novo.");

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err.message || "Ocorreu um erro ao validar o token de recuperação da senha",
    });
  }
});
