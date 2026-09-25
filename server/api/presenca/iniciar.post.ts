import prisma from "@/lib/prisma";
import { z } from "zod";

const iniciarSchema = z.object({
  codigoSessao: z.string().min(8).max(100),
  paginaAtual: z.string().max(255).nullish(),
});

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth;
    if (!auth?.id) throw new Error("Usuário não autenticado");

    const body = await readValidatedBody(event, iniciarSchema.parseAsync);
    const agora = new Date();
    const ip = getRequestIP(event, { xForwardedFor: true }) || null;
    const userAgent = getHeader(event, "user-agent") || null;

    const sessaoExistente = await prisma.sessaoPresenca.findFirst({
      where: {
        usuario_id: auth.id,
        empresa_id: auth.empresa_id,
        codigo_sessao: body.codigoSessao,
      },
      select: { id: true },
    });

    if (sessaoExistente) {
      await prisma.sessaoPresenca.update({
        where: { id: sessaoExistente.id },
        data: {
          pagina_atual: body.paginaAtual || null,
          ip,
          user_agent: userAgent,
          ultimo_heartbeat: agora,
          encerrado: null,
        },
      });
    } else {
      await prisma.sessaoPresenca.create({
        data: {
          usuario_id: auth.id,
          empresa_id: auth.empresa_id,
          codigo_sessao: body.codigoSessao,
          pagina_atual: body.paginaAtual || null,
          ip,
          user_agent: userAgent,
          ultimo_heartbeat: agora,
        },
      });
    }

    return { ok: true };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao iniciar presença",
    });
  }
});
