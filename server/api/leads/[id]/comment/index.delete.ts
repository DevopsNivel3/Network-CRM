import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { deleteAttachmentFiles } from "@/server/utils/attachmentFiles";

const deleteOportunidadeComentarioBodySchema = z.object({
  comment_id: createNumberSchema("Id do Comentário"),
});

// Rota para criar um comentário na oportunidade
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_OPORTUNIDADE,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      deleteOportunidadeComentarioBodySchema.parseAsync,
    );
    const where: Prisma.LeadComentariosWhereUniqueInput = {
      lead_id: id,
      id: body.comment_id,
    };

    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      where.usuario_id = event.context.auth.id;

    const anexos = await prisma.leadComentarioAnexo.findMany({
      where: { comentario_id: body.comment_id },
      select: { url: true },
    });

    const data = await prisma.leadComentarios.delete({
      where,
    });

    const uploadsDir = useRuntimeConfig().public.fileStorage.mount;
    deleteAttachmentFiles(
      uploadsDir,
      anexos.map((item) => item.url),
      event.context.auth.empresa_id,
    );

    await logger.delete(event, JSON.stringify(data));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao deletar o comentário",
    });
  }
});
