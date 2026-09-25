import prisma from "@/lib/prisma";
import { deletePushSubscription } from "@/server/utils/web-push";
import { z } from "zod";

const unsubscribePushBodySchema = z.object({
  endpoint: z.string().url("Endpoint de push inválido"),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      unsubscribePushBodySchema.parseAsync,
    );

    await deletePushSubscription(prisma, event.context.auth.id, body.endpoint);

    return {
      ok: true,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao remover assinatura push",
    });
  }
});
