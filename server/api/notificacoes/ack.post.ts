import prisma from "@/lib/prisma";
import { z } from "zod";

const ackNotificacoesBodySchema = z.object({
  ids: z.array(z.number()).min(1, "Nenhuma notificação informada"),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      ackNotificacoesBodySchema.parseAsync,
    );

    const result = await prisma.notificacaoUsuario.updateMany({
      where: {
        id: { in: body.ids },
        usuario_id: event.context.auth.id,
        entregue_em: null,
      },
      data: {
        entregue_em: new Date(),
      },
    });

    return {
      ok: true,
      updated: result.count,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao confirmar notificações",
    });
  }
});
