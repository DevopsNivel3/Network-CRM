import prisma from "@/lib/prisma";
import { savePushSubscription } from "@/server/utils/web-push";
import { z } from "zod";

const pushSubscriptionBodySchema = z.object({
  endpoint: z.string().url("Endpoint de push inválido"),
  expirationTime: z.union([z.number(), z.string(), z.null()]).optional(),
  keys: z.object({
    p256dh: z.string().min(1, "Chave p256dh obrigatória"),
    auth: z.string().min(1, "Chave auth obrigatória"),
  }),
  userAgent: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      pushSubscriptionBodySchema.parseAsync,
    );

    await savePushSubscription(
      prisma,
      event.context.auth.id,
      event.context.auth.empresa_id,
      body,
    );

    return {
      ok: true,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao salvar assinatura push",
    });
  }
});
