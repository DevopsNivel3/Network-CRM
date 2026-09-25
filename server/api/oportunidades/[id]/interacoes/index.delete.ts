import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { deleteAttachmentFiles } from "@/server/utils/attachmentFiles";

const deleteOportunidadeInteracaoBodySchema = z.object({
  interacao_id: createNumberSchema("Id da Interação"),
  oportunidade_id: createNumberSchema("Id da Oportunidade").optional(),
});

// Rota para deletar uma interação de uma oportunidade
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
      deleteOportunidadeInteracaoBodySchema.parseAsync,
    );
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

    const anexos = await prisma.oportunidadeInteracaoAnexo.findMany({
      where: { interacao_id: body.interacao_id },
      select: { url: true },
    });

    const interacao = await prisma.oportunidadeInteracoes.delete({
      where,
    });

    const uploadsDir = useRuntimeConfig().public.fileStorage.mount;
    deleteAttachmentFiles(
      uploadsDir,
      anexos.map((item) => item.url),
      event.context.auth.empresa_id,
    );

    await logger.delete(event, JSON.stringify(interacao));

    return interacao;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao remover a interação da oportunidade",
    });
  }
});
