import prisma from "@/lib/prisma";
import { z } from "zod";

const updateBoardStatusBodySchema = z.object({
  posicao: createNumberSchema("Posição"),
});

// Rota para atualizar a posição de um board
export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
    const body = await readValidatedBody(event, updateBoardStatusBodySchema.parseAsync);

    const board = await prisma.boardOportunidade.update({
      where: { id },
      data: { posicao: body.posicao ?? 0 },
    });

    await logger.update(event, JSON.stringify(board));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao atualizar a posição",
    });
  }
});
