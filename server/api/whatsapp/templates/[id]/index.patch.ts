import prisma from "@/lib/prisma";
import { z } from "zod";

const templateSchema = z.object({
  titulo: z.string().min(1).optional(),
  corpo: z.string().min(1).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
    const body = await readValidatedBody(event, templateSchema.parseAsync);
    const empresaId = event.context.auth.empresa_id;

    const template = await prisma.whatsappTemplate.update({
      where: { id, empresa_id: empresaId },
      data: {
        ...(body.titulo ? { titulo: body.titulo } : {}),
        ...(body.corpo ? { corpo: body.corpo } : {}),
      },
    });

    return template;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao atualizar template do WhatsApp",
    });
  }
});
