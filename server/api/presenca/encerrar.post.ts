import prisma from "@/lib/prisma";
import { z } from "zod";

const encerrarSchema = z.object({
  codigoSessao: z.string().min(8).max(100),
});

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth;
    if (!auth?.id) throw new Error("Usuário não autenticado");

    const body = await readValidatedBody(event, encerrarSchema.parseAsync);
    const agora = new Date();

    await prisma.sessaoPresenca.updateMany({
      where: {
        usuario_id: auth.id,
        empresa_id: auth.empresa_id,
        codigo_sessao: body.codigoSessao,
        encerrado: null,
      },
      data: {
        encerrado: agora,
        ultimo_heartbeat: agora,
      },
    });

    return { ok: true };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao encerrar presença",
    });
  }
});
