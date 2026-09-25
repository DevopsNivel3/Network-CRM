import prisma from "@/lib/prisma";
import { z } from "zod";

const readNotificacoesBodySchema = z
  .object({
    ids: z.array(z.number()).optional(),
    all: z.boolean().optional(),
  })
  .refine((value) => value.all === true || (value.ids?.length || 0) > 0, {
    message: "Informe as notificações para marcar como lidas",
  });

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      readNotificacoesBodySchema.parseAsync,
    );

    const result = await prisma.notificacaoUsuario.updateMany({
      where: {
        usuario_id: event.context.auth.id,
        lida: false,
        ...(body.all ? {} : { id: { in: body.ids || [] } }),
      },
      data: {
        lida: true,
        lida_em: new Date(),
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
      message: err?.message || "Erro ao marcar notificações como lidas",
    });
  }
});
