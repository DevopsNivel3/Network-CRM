import prisma from "@/lib/prisma";
import { z } from "zod";

const templateSchema = z.object({
  titulo: z.string().min(1),
  corpo: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(event, templateSchema.parseAsync);
    const empresaId = event.context.auth.empresa_id;

    const template = await prisma.whatsappTemplate.create({
      data: {
        empresa_id: empresaId,
        titulo: body.titulo,
        corpo: body.corpo,
      },
    });

    return template;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao criar template do WhatsApp",
    });
  }
});
