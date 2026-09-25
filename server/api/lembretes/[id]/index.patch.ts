import prisma from "~/lib/prisma";
import { z } from "zod";

export const updateLembreteBodySchema = z.object({
  status: z.string().optional(),
  data_vencimento: z.string().optional(),
  descricao: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    
    const body = await readValidatedBody(
      event,
      updateLembreteBodySchema.parseAsync,
    );

    const dataToUpdate: any = {};
    if (body.status) dataToUpdate.status = body.status;
    if (body.descricao) dataToUpdate.descricao = body.descricao;
    if (body.data_vencimento) dataToUpdate.data_vencimento = new Date(body.data_vencimento);

    const lembrete = await prisma.lembrete.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return lembrete;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao atualizar lembrete",
    });
  }
});