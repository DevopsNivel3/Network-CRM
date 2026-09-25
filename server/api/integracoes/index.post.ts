import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  tipo: z.string().min(1),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(event, schema.parseAsync);
    const empresaId = event.context.auth.empresa_id;

    const integracao = await prisma.integracao.upsert({
      where: { empresa_id_tipo: { empresa_id: empresaId, tipo: body.tipo } },
      update: { enabled: body.enabled },
      create: {
        empresa_id: empresaId,
        tipo: body.tipo,
        enabled: body.enabled,
        config: body.config ?? undefined,
      },
      select: {
        id: true,
        tipo: true,
        enabled: true,
        config: true,
        criado: true,
        atualizado: true,
      },
    });

    return integracao;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao criar integração",
    });
  }
});
