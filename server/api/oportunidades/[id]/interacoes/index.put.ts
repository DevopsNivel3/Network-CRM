import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getHtmlLength, sanitizeHtml } from "@/server/utils/sanitizeHtml";
import { normalizeAttachments } from "@/server/utils/normalizeAttachments";
import { z } from "zod";
import { deleteAttachmentFiles } from "@/server/utils/attachmentFiles";

const updateOportunidadeInteracaoBodySchema = z.object({
  tipo: createNumberSchema("Tipo"),
  status: createNumberSchema("Status"),
  conteudo: z.string().nullable().optional(),
  data: z.string().nullable().optional(),
  interacao_id: createNumberSchema("Id da Interação"),
  oportunidade_id: createNumberSchema("Id da Oportunidade").optional(),
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

// Rota para editar uma interação na oportunidade
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
      updateOportunidadeInteracaoBodySchema.parseAsync,
    );
    const data: Prisma.OportunidadeInteracoesUpdateInput = {};
    const where: Prisma.OportunidadeInteracoesWhereUniqueInput = {
      oportunidade_id: id,
      id: body.interacao_id,
    };

    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );
    if (!isAdmin) {
      const isPrincipal = await prisma.oportunidadeResponsaveis.findFirst({
        where: {
          oportunidade_id: id,
          usuario_id: event.context.auth.id,
          principal: true,
        },
        select: { id: true },
      });
      if (!isPrincipal) where.usuario_id = event.context.auth.id;
    }

    if (body.data) data.data = body.data ? new Date(body.data) : new Date();
    const sanitized = body.conteudo ? sanitizeHtml(body.conteudo) : "";
    const attachments = body.anexos ? normalizeAttachments(body.anexos) : null;
    if (sanitized && getHtmlLength(sanitized) > 4096)
      throw new Error("Conteúdo muito grande");
    data.conteudo = sanitized || null;
    if (body.status) data.status = body.status;
    if (body.tipo) data.tipo = body.tipo;

    const interacao = await prisma.oportunidadeInteracoes.update({
      where,
      data,
      select: {
        id: true,
        conteudo: true,
        statusInt: true,
        status: true,
        tipo: true,
        data: true,
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
      },
    });

    if (attachments) {
      const existing = await prisma.oportunidadeInteracaoAnexo.findMany({
        where: { interacao_id: interacao.id },
        select: { url: true },
      });
      const existingUrls = existing.map((item) => item.url);
      const nextUrls = attachments.map((item) => item.url);
      const removed = existingUrls.filter((url) => !nextUrls.includes(url));

      await prisma.oportunidadeInteracaoAnexo.deleteMany({
        where: { interacao_id: interacao.id },
      });

      if (attachments.length) {
        await prisma.oportunidadeInteracaoAnexo.createMany({
          data: attachments.map((item) => ({
            interacao_id: interacao.id,
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

    const withAnexos = await prisma.oportunidadeInteracoes.findUnique({
      where: { id: interacao.id },
      select: {
        id: true,
        conteudo: true,
        statusInt: true,
        status: true,
        tipo: true,
        data: true,
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
        anexos: true,
      },
    });

    await logger.update(event, JSON.stringify(interacao));

    return withAnexos || interacao;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao editar interação",
    });
  }
});
