import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const passwordUserBodySchema = z.object({
  senha: senhaSchema,
  novaSenha: senhaSchema,
});

// Rota para atualizar a senha do usuário
export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, passwordUserBodySchema.parseAsync);

    const where: Prisma.UsuarioWhereUniqueInput = {
      id: event.context.auth.id,
      empresa_id: event.context.auth.empresa_id,
    };
    const data: Prisma.UsuarioUpdateInput = {};

    if (body.senha && body.novaSenha) {
      const user = await prisma.usuario.findUnique({
        where,
      });
      if (!user) throw new Error("Usuário não encontrado");

      const isPasswordValid = await bcrypt.compare(body.senha, user.senha);
      if (!isPasswordValid) throw new Error("Senha atual inválida");

      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(body.novaSenha, salt);
      data.senha = hash;
    }

    const userUpdated = await prisma.usuario.update({
      where,
      data,
    });

    await logger.update(event, JSON.stringify({ ...userUpdated, senha: null }));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar a senha do Usuário",
    });
  }
});
