import prisma from "@/lib/prisma";
import { z } from "zod";

const heartbeatSchema = z.object({
  codigoSessao: z.string().min(8).max(100),
  paginaAtual: z.string().max(255).nullish(),
});

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth;
    if (!auth?.id) throw new Error("Usuário não autenticado");

    const body = await readValidatedBody(event, heartbeatSchema.parseAsync);
    const agora = new Date();

    const updated = await prisma.sessaoPresenca.updateMany({
      where: {
        usuario_id: auth.id,
        empresa_id: auth.empresa_id,
        codigo_sessao: body.codigoSessao,
        encerrado: null,
      },
      data: {
        ultimo_heartbeat: agora,
        pagina_atual: body.paginaAtual || null,
      },
    });

    if (!updated.count) {
      await prisma.sessaoPresenca.create({
        data: {
          usuario_id: auth.id,
          empresa_id: auth.empresa_id,
          codigo_sessao: body.codigoSessao,
          pagina_atual: body.paginaAtual || null,
          ultimo_heartbeat: agora,
          ip: getRequestIP(event, { xForwardedFor: true }) || null,
          user_agent: getHeader(event, "user-agent") || null,
        },
      });
    }

    return { ok: true };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao atualizar presença",
    });
  }
});
