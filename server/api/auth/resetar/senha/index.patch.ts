import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const passwordResetChangeBodySchema = z.object({
  token: createStringSchema("Token"),
  novaSenha: senhaSchema,
  checkNovaSenha: senhaSchema,
});

// Altera a senha do usuário com o token de recuperação
export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, passwordResetChangeBodySchema.parseAsync);

    const tokenExists = await prisma.usuarioSenhaReset.findFirst({
      where: { token: body.token },
      select: { criado: true, usuario_id: true, usado: true },
    });

    // Verifica se o token existe e se foi criado & Verifica se já existe um token de recuperação de senha válido e se ele foi criado há menos de 2 horas
    if (
      !tokenExists ||
      tokenExists.usado ||
      Date.now() - new Date(tokenExists.criado).getTime() > 2 * 60 * 60 * 1000
    )
      throw new Error("Token de recuperação de senha inválido ou expirado.");

    const data: Prisma.UsuarioUpdateInput = {};
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: tokenExists.usuario_id,
      },
    });
    if (!usuario) throw new Error("Usuário não encontrado");

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(body.novaSenha, salt);
    data.senha = hash;

    await prisma.usuario.update({
      where: {
        id: tokenExists.usuario_id,
      },
      data,
    });

    await prisma.usuarioSenhaReset.update({
      where: {
        token: body.token,
      },
      data: {
        usado: true,
      },
    });

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err.message || "Ocorreu um erro ao validar o token de recuperação da senha",
    });
  }
});
