import prisma from "@/lib/prisma";
import { applyBoardAssignedUserToOpportunity } from "@/server/utils/board-assignment";
import { notifyOpportunityAssignment } from "@/server/utils/opportunity-notifications";
import { publishOpportunityBoardStream } from "@/server/utils/opportunityBoardStream";
import { syncOpportunityRemindersWithBoard } from "@/server/utils/opportunity-reminders";
import { validateBoardMoveReason } from "@/server/utils/board-move-reason";
import { z } from "zod";

export const updateStatusOportunidadeBodySchema = z.object({
  posicao: z.number().nullable().optional(),
  board_id: createNumberSchema("BoardId").nullable().optional(),
  motivo: z.string().trim().max(100).nullable().optional(),
  motivo_observacao: z.string().trim().max(1000).nullable().optional(),
});

// Rota para atualizar a posição de uma oportunidade
export default defineEventHandler(async (event) => {
  try {
    const hasGlobalEdit = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.EDITAR_OPORTUNIDADE,
    );

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      updateStatusOportunidadeBodySchema.parseAsync,
    );

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    const oportunidade = await prisma.oportunidade.findUnique({
      where: { id },
      select: {
        id: true,
        board_id: true,
        posicao: true,
        lead: { select: { empresa_id: true } },
        responsaveis: {
          where: { usuario_id: event.context.auth.id },
          select: { principal: true, pode_editar: true },
          take: 1,
        },
      },
    });
    if (!oportunidade) throw new Error("Oportunidade não encontrada");
    if (
      !isGrantAdmin &&
      oportunidade.lead.empresa_id !== event.context.auth.empresa_id
    )
      throw new Error("Oportunidade não encontrada");

    const responsavelAtual = oportunidade.responsaveis[0];
    const canEdit =
      isAdmin ||
      isGrantAdmin ||
      hasGlobalEdit ||
      !!responsavelAtual?.principal ||
      !!responsavelAtual?.pode_editar;
    if (!canEdit) throw new Error("Você não tem permissão suficiente");

    const moveReason = await validateBoardMoveReason(prisma, {
      targetBoardId: body.board_id,
      previousBoardId: oportunidade.board_id,
      empresaId: oportunidade.lead.empresa_id,
      motivo: body.motivo,
      motivoObservacao: body.motivo_observacao,
    });

    const oportunidade_data = await prisma.oportunidade.update({
      where: { id },
      data: { board_id: body.board_id, posicao: body.posicao ?? 0 },
    });

    await syncOpportunityRemindersWithBoard(prisma, oportunidade_data.id);

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
        acao: "UPDATE",
        motivo: moveReason.motivo,
        motivo_observacao: moveReason.motivoObservacao,
        descricao: "Status e posição alterados",
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

    publishOpportunityBoardStream(oportunidade.lead.empresa_id, {
      type: "board_card_updated",
      payload: {
        oportunidadeId: oportunidade_data.id,
        previousBoardId: oportunidade.board_id,
        previousPosicao: oportunidade.posicao,
        boardId: oportunidade_data.board_id,
        posicao: oportunidade_data.posicao,
        actorUserId: event.context.auth.id,
        updatedAt: new Date().toISOString(),
      },
    });

    await logger.update(event, JSON.stringify(body));

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao atualizar a posição",
    });
  }
});
