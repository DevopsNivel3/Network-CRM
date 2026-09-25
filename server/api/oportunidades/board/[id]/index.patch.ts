import prisma from "@/lib/prisma";
import { deleteBoardOpportunityReminders } from "@/server/utils/opportunity-reminders";
import { z } from "zod";

const updateBoardBodySchema = z.object({
  titulo: createStringSchema("Título").optional(),
  descricao: createStringSchema("Descrição").nullable().optional(),
  posicao: createNumberSchema("Posição").optional(),
  cor: createStringSchema("Cor").optional(),
  qualificacao: z.enum(["Prospecção", "Frio", "Morno", "Quente", "Fechado", "Cancelado", "Declinado"]).optional(),
  controle_lembretes: z.boolean().optional(),
  exige_motivo: z.boolean().optional(),
  grupo_motivos: z.string().trim().max(100).nullable().optional(),
  motivos: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  exigir_obs_outro: z.boolean().optional(),
  usuario_atribuido_id: createNumberSchema("Usuário atribuído").nullable().optional(),
});

// Rota para atualizar a posição de um board
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.EDITAR_OPORTUNIDADE,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      updateBoardBodySchema.parseAsync,
    );

    const board = await prisma.boardOportunidade.update({
      where: { id },
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        posicao: body.posicao,
        cor: body.cor,
        qualificacao: body.qualificacao,
        ...(body.controle_lembretes !== undefined
          ? {
              controle_lembretes: body.controle_lembretes,
            }
          : {}),
        ...(body.exige_motivo !== undefined
          ? { exige_motivo: body.exige_motivo }
          : {}),
        ...(body.grupo_motivos !== undefined
          ? { grupo_motivos: body.grupo_motivos }
          : {}),
        ...(body.motivos !== undefined
          ? { motivos: [...new Set(body.motivos)] }
          : {}),
        ...(body.exigir_obs_outro !== undefined
          ? { exigir_obs_outro: body.exigir_obs_outro }
          : {}),
        ...(body.usuario_atribuido_id === null
          ? {
              usuario_atribuido: {
                disconnect: true,
              },
            }
          : typeof body.usuario_atribuido_id === "number"
            ? {
                usuario_atribuido: {
                  connect: {
                    id: body.usuario_atribuido_id,
                  },
                },
              }
            : {}),
      },
    });

    if (body.controle_lembretes === false) {
      await deleteBoardOpportunityReminders(prisma, id);
    }

    await logger.update(event, JSON.stringify(board));

    return board;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao atualizar a posição",
    });
  }
});
