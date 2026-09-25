import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { applyBoardAssignedUserToOpportunity } from "@/server/utils/board-assignment";
import { notifyOpportunityAssignment } from "@/server/utils/opportunity-notifications";
import { publishOpportunityBoardStream } from "@/server/utils/opportunityBoardStream";
import { syncOpportunityRemindersWithBoard } from "@/server/utils/opportunity-reminders";
import { validateBoardMoveReason } from "@/server/utils/board-move-reason";
import { z } from "zod";

const updateOportunidadeBodySchema = z.object({
  tipo: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  posicao: z.number().nullable().optional(),
  board_id: createNumberSchema("BoardId").nullable().optional(),
  valor_estimado: createNumberSchema("Valor Estimado").nullable().optional(),
  faixa_valor: z.string().nullable().optional(),
  num_pdvs: z.number().nullable().optional(),
  num_lojas: z.number().nullable().optional(),
  infraestrutura: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  controle_lembretes: z.boolean().optional(),
  desativado: z.boolean().optional(),
  motivo: z.string().trim().max(100).nullable().optional(),
  motivo_observacao: z.string().trim().max(1000).nullable().optional(),
});

// Rota para atualização de oportunidades
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
      updateOportunidadeBodySchema.parseAsync,
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

    const moveReason = body.board_id !== undefined
      ? await validateBoardMoveReason(prisma, {
          targetBoardId: body.board_id,
          previousBoardId: oportunidade.board_id,
          empresaId: oportunidade.lead.empresa_id,
          motivo: body.motivo,
          motivoObservacao: body.motivo_observacao,
        })
      : { motivo: null, motivoObservacao: null };

    const data: Prisma.OportunidadeUpdateInput = {};
    data.tipo = body.tipo;
    if (body.board_id !== undefined) {
      data.board =
        body.board_id === null
          ? { disconnect: true }
          : { connect: { id: body.board_id } };
    }
    if (body.faixa_valor) data.faixa_valor = body.faixa_valor;
    data.valor_estimado = body.valor_estimado;
    data.num_pdvs = body.num_pdvs;
    data.num_lojas = body.num_lojas;
    data.infraestrutura = body.infraestrutura;
    data.descricao = body.descricao;
    data.observacoes = body.observacoes;
    if (body.controle_lembretes !== undefined) data.controle_lembretes = body.controle_lembretes;
    if (body.desativado !== undefined) data.desativado = body.desativado;

    const oportunidade_data = await prisma.oportunidade.update({
      where: { id },
      data,
      select: {
        id: true,
        lead_id: true,
        tipo: true,
        descricao: true,
        statusInt: true,
        board_id: true,
        valor_estimado: true,
        posicao: true,
        faixa_valor: true,
        num_pdvs: true,
        num_lojas: true,
        observacoes: true,
        infraestrutura: true,
        controle_lembretes: true,
        desativado: true,
        criado: true,
        atualizado: true,
        lead: {
          select: {
            id: true,
            nome_lead: true,
            contato_nome: true,
            contato: true,
          },
        },
        responsaveis: {
          select: {
            principal: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                avatar: true,
              },
            },
          },
          orderBy: [{ principal: "desc" }, { criado: "asc" }],
          take: 3,
        },
        _count: {
          select: {
            responsaveis: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            avatar: true,
          },
        },
      },
    });

    if (body.board_id !== undefined) {
      await syncOpportunityRemindersWithBoard(prisma, oportunidade_data.id);
    }

    if (body.board_id !== undefined && body.board_id !== null) {
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
    }

    let responsavelAtualResponse =
      await prisma.oportunidadeResponsaveis.findFirst({
        where: { oportunidade_id: id, usuario_id: event.context.auth.id },
        select: {
          principal: true,
          gerencia_responsaveis: true,
          pode_editar: true,
          pode_interacoes: true,
          pode_visitas: true,
        },
      });

    if (
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GERENCIAR_RESPONSAVEIS,
      )
    ) {
      responsavelAtualResponse = {
        principal: true,
        gerencia_responsaveis: true,
        pode_editar: true,
        pode_interacoes: true,
        pode_visitas: true,
      };
    }

    if (body.board_id !== undefined) {
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
        type: body.desativado ? "board_card_removed" : "board_card_updated",
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
    } else if (body.desativado === true) {
      publishOpportunityBoardStream(oportunidade.lead.empresa_id, {
        type: "board_card_removed",
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
    }

    if (body.controle_lembretes === false) {
      await prisma.lembrete.deleteMany({
        where: { oportunidade_id: id },
      });
    }

    await logger.update(event, JSON.stringify(data));

    return {
      ...oportunidade_data,
      responsavel_atual: responsavelAtualResponse,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar a Oportunidade",
    });
  }
});
