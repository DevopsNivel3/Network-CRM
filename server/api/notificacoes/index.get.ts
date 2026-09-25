import prisma from "@/lib/prisma";
import { z } from "zod";

const notificacoesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  onlyUnread: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
  onlyPendingBrowser: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
});

export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(
      event,
      notificacoesQuerySchema.parseAsync,
    );

    const notificacoes = await prisma.notificacaoUsuario.findMany({
      where: {
        usuario_id: event.context.auth.id,
        ...(query.onlyUnread ? { lida: false } : {}),
        ...(query.onlyPendingBrowser ? { entregue_em: null } : {}),
      },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        mensagem: true,
        link: true,
        payload: true,
        lida: true,
        lida_em: true,
        entregue_em: true,
        criado: true,
      },
      orderBy: {
        criado: "desc",
      },
      take: query.limit,
    });

    return notificacoes.map((item) => ({
      ...item,
      criado: item.criado.toISOString(),
      lida_em: item.lida_em?.toISOString() || null,
      entregue_em: item.entregue_em?.toISOString() || null,
    }));
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar notificações",
    });
  }
});
