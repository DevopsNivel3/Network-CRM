import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  getHtmlLength,
  isHtmlEmpty,
  sanitizeHtml,
} from "@/server/utils/sanitizeHtml";
import { normalizeAttachments } from "@/server/utils/normalizeAttachments";
import { z } from "zod";
import { deleteAttachmentFiles } from "@/server/utils/attachmentFiles";

const updateOportunidadeComentarioBodySchema = z.object({
  comment_id: createNumberSchema("Id do Comentário"),
  descricao: createStringSchema("Descrição"),
  anexos: z
    .array(
      z.object({
        nome: z.string().optional().nullable(),
        url: z.string(),
        tipo: z.string().optional().nullable(),
        tamanho: z.number().optional().nullable(),
      }),
    )
    .optional(),
});

// Rota para editar um comentário na oportunidade
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
      updateOportunidadeComentarioBodySchema.parseAsync,
    );
    const where: Prisma.OportunidadeComentariosWhereUniqueInput = {
      oportunidade_id: id,
      id: body.comment_id,
    };

    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      where.usuario_id = event.context.auth.id;

    const sanitized = sanitizeHtml(body.descricao);
    if (getHtmlLength(sanitized) > 8192)
      throw new Error("Comentário muito grande");

    const attachments = body.anexos ? normalizeAttachments(body.anexos) : null;
    if ((!sanitized || isHtmlEmpty(sanitized)) && !(attachments?.length || 0))
      throw new Error("Comentário inválido");
    const data = await prisma.oportunidadeComentarios.update({
      where,
      data: {
        descricao: sanitized,
      },
      select: {
        id: true,
        descricao: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        criado: true,
        atualizado: true,
      },
    });

    if (attachments) {
      const existing = await prisma.oportunidadeComentarioAnexo.findMany({
        where: { comentario_id: data.id },
        select: { url: true },
      });
      const existingUrls = existing.map((item) => item.url);
      const nextUrls = attachments.map((item) => item.url);
      const removed = existingUrls.filter((url) => !nextUrls.includes(url));

      await prisma.oportunidadeComentarioAnexo.deleteMany({
        where: { comentario_id: data.id },
      });

      if (attachments.length) {
        await prisma.oportunidadeComentarioAnexo.createMany({
          data: attachments.map((item) => ({
            comentario_id: data.id,
            usuario_id: event.context.auth.id,
            nome: item.nome,
            url: item.url,
            tipo: item.tipo || undefined,
            tamanho: item.tamanho ?? undefined,
          })),
        });
      }

      if (removed.length) {
        const uploadsDir = useRuntimeConfig().public.fileStorage.mount;
        deleteAttachmentFiles(
          uploadsDir,
          removed,
          event.context.auth.empresa_id,
        );
      }
    }

    const withAnexos = await prisma.oportunidadeComentarios.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        descricao: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
        criado: true,
        atualizado: true,
        anexos: true,
      },
    });

    await logger.update(event, JSON.stringify(data));

    return withAnexos || data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao editar comentário",
    });
  }
});
