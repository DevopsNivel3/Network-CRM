import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { applyBoardAssignedUserToOpportunity } from "@/server/utils/board-assignment";
import { notifyOpportunityAssignment } from "@/server/utils/opportunity-notifications";
import { publishOpportunityBoardStream } from "@/server/utils/opportunityBoardStream";
import { validateBoardMoveReason } from "@/server/utils/board-move-reason";
import { z } from "zod";

const createOportunidadeBodySchema = z.object({
  tipo: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  posicao: z.number().nullable().optional(),
  statusInt: createNumberSchema("Status").nullable().optional(),
  board_id: createNumberSchema("BoardId").nullable().optional(),
  valor_estimado: createNumberSchema("Valor Estimado").nullable().optional(),
  faixa_valor: z.string().nullable().optional(),
  num_pdvs: z.number().nullable().optional(),
  num_lojas: z.number().nullable().optional(),
  infraestrutura: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  controle_lembretes: z.boolean().optional().default(true),
  lead_id: z.number({ message: "Id do Lead" }),
  motivo: z.string().trim().max(100).nullable().optional(),
  motivo_observacao: z.string().trim().max(1000).nullable().optional(),
});

// Rota para criar uma Oportunidade
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.CRIAR_OPORTUNIDADE,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(
      event,
      createOportunidadeBodySchema.parseAsync,
    );

    const targetLead = await prisma.lead.findUnique({
      where: { id: body.lead_id },
      select: { empresa_id: true },
    });
    if (!targetLead || targetLead.empresa_id !== event.context.auth.empresa_id) {
      throw new Error("Lead não encontrado");
    }
    const moveReason = await validateBoardMoveReason(prisma, {
      targetBoardId: body.board_id,
      previousBoardId: null,
      empresaId: targetLead.empresa_id,
      motivo: body.motivo,
      motivoObservacao: body.motivo_observacao,
    });

    const minPosicaoOportunidade = await prisma.oportunidade.findFirst({
      orderBy: {
        posicao: "asc",
      },
      select: {
        posicao: true,
      },
    });

    let newPosicao: number = 0;
    if (minPosicaoOportunidade)
      newPosicao = minPosicaoOportunidade.posicao - 0.0001;

    const data: Prisma.OportunidadeCreateInput = {
      tipo: body.tipo,
      faixa_valor: body.faixa_valor,
      valor_estimado: body.valor_estimado,
      num_pdvs: body.num_pdvs,
      num_lojas: body.num_lojas,
      posicao: newPosicao,
      observacoes: body.observacoes,
      descricao: body.descricao,
      controle_lembretes: body.controle_lembretes,
      infraestrutura: body.infraestrutura,
      lead: {
        connect: {
          id: body.lead_id,
        },
      },
      usuario: {
        connect: {
          id: event.context.auth.id,
        },
      },
    };

    if (body.board_id)
      data.board = {
        connect: {
          id: body.board_id,
        },
      };

    const oportunidade_data = await prisma.oportunidade.create({
      data,
      select: {
        id: true,
        lead_id: true,
        tipo: true,
        descricao: true,
        statusInt: true,
        board_id: true,
        posicao: true,
        controle_lembretes: true,
        desativado: true,
        criado: true,
        atualizado: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
      },
    });

    await prisma.oportunidadeResponsaveis.create({
      data: {
        oportunidade_id: oportunidade_data.id,
        usuario_id: event.context.auth.id,
        principal: true,
        gerencia_responsaveis: false,
        pode_editar: true,
        pode_interacoes: true,
        pode_visitas: true,
      },
    });

    const boardAssignment = await applyBoardAssignedUserToOpportunity(
      prisma,
      oportunidade_data.id,
      oportunidade_data.board_id,
    );

    if (boardAssignment?.grantedManagement || boardAssignment?.createdResponsavel) {
      await notifyOpportunityAssignment(prisma, {
        oportunidadeId: oportunidade_data.id,
        actorUserId: event.context.auth.id,
        assignedUserIds: [boardAssignment.assignedUserId],
        source: "board",
      });
    }

    await prisma.oportunidadeHistorico.create({
      data: {
        board_id: oportunidade_data.board_id,
        posicao: oportunidade_data.posicao,
        acao: "CREATE",
        motivo: moveReason.motivo,
        motivo_observacao: moveReason.motivoObservacao,
        descricao: "Oportunidade criada",
        oportunidade: {
          connect: {
            id: oportunidade_data.id,
          },
        },
        usuario: {
          connect: {
            id: event.context.auth.id,
          },
        },
      },
    });

    const leadEmpresa = await prisma.lead.findUnique({
      where: { id: oportunidade_data.lead_id },
      select: {
        empresa_id: true,
      },
    });

    if (leadEmpresa?.empresa_id) {
      publishOpportunityBoardStream(leadEmpresa.empresa_id, {
        type: "board_card_created",
        payload: {
          oportunidadeId: oportunidade_data.id,
          previousBoardId: null,
          boardId: oportunidade_data.board_id,
          posicao: oportunidade_data.posicao,
          actorUserId: event.context.auth.id,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    await logger.create(event, JSON.stringify(data));

    return oportunidade_data;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao criar a Oportunidade",
    });
  }
});
