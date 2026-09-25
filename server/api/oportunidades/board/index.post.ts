import prisma from "@/lib/prisma";
import { z } from "zod";

const createBoardBodySchema = z.object({
  titulo: z.string({ message: "Título é obrigatório" }),
  descricao: createStringSchema("Descrição").nullable().optional(),
  posicao: createNumberSchema("Posição").optional(),
  cor: createStringSchema("Cor").optional(),
  qualificacao: z.enum(["Prospecção", "Frio", "Morno", "Quente", "Fechado", "Cancelado", "Declinado"], {
    required_error: "Qualificação da oportunidade é obrigatória",
    invalid_type_error: "Qualificação da oportunidade inválida",
  }),
  controle_lembretes: z.boolean().optional().default(true),
  exige_motivo: z.boolean().optional().default(false),
  grupo_motivos: z.string().trim().max(100).nullable().optional(),
  motivos: z.array(z.string().trim().min(1).max(100)).max(50).optional().default([]),
  exigir_obs_outro: z.boolean().optional().default(false),
  usuario_atribuido_id: createNumberSchema("Usuário atribuído").nullable().optional(),
});

// Rota para criar um board
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(
      event,
      createBoardBodySchema.parseAsync,
    );

    const maxPosicaoBoard = await prisma.boardOportunidade.findFirst({
      where: {
        empresa_id: event.context.auth.empresa_id,
      },
      orderBy: {
        posicao: "desc",
      },
      select: {
        posicao: true,
      },
    });

    let newPosicao: number = 0;
    if (maxPosicaoBoard) newPosicao = maxPosicaoBoard.posicao + 0.0001;

    const board = await prisma.boardOportunidade.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        posicao: newPosicao,
        cor: body.cor,
        qualificacao: body.qualificacao,
        controle_lembretes: body.controle_lembretes,
        exige_motivo: body.exige_motivo,
        grupo_motivos: body.grupo_motivos,
        motivos: [...new Set(body.motivos)],
        exigir_obs_outro: body.exigir_obs_outro,
        ...(typeof body.usuario_atribuido_id === "number"
          ? {
              usuario_atribuido: {
                connect: {
                  id: body.usuario_atribuido_id,
                },
              },
            }
          : {}),
        empresa: {
          connect: {
            id: event.context.auth.empresa_id,
          },
        },
      },
    });

    await logger.create(event, JSON.stringify(board));

    return board;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao criar o Board",
    });
  }
});
