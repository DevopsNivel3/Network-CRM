import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { applyBoardAssignedUserToOpportunity } from "@/server/utils/board-assignment";
import { validateBoardMoveReason } from "@/server/utils/board-move-reason";
import { notifyOpportunityAssignment } from "@/server/utils/opportunity-notifications";
import { publishOpportunityBoardStream } from "@/server/utils/opportunityBoardStream";
import { z } from "zod";

const importWizardSchemaBody = z
  .object({
    data: z.array(z.record(z.any())),
    mapping: z.record(z.string()),
    create_opportunities: z.boolean().optional().default(false),
    board_id: z.number().int().positive().nullable().optional(),
    motivo: z.string().trim().max(100).nullable().optional(),
    motivo_observacao: z.string().trim().max(1000).nullable().optional(),
  })
  .superRefine((body, ctx) => {
    if (body.create_opportunities && !body.board_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["board_id"],
        message: "Selecione o status das oportunidades",
      });
    }
  });

interface ImportResult {
  success: number;
  errors: number;
  opportunitiesCreated: number;
  errorDetails: string[];
}

const allowedLeadFields = new Set([
  "nome_lead",
  "cpf_cnpj",
  "responsavel",
  "contato_nome",
  "contato",
  "atividade",
  "faturamento",
  "num_funcionarios",
  "origem_lead",
  "observacoes",
]);

const normalizeCpfCnpj = (value?: string | null) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits || null;
};

const buildDuplicateLeadMessage = (leadName?: string | null) =>
  `CPF/CNPJ já cadastrado${leadName ? `: ${leadName}` : "."}`;

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)) {
      throw new Error("Você não tem permissão suficiente");
    }

    const body = await readValidatedBody(event, importWizardSchemaBody.parseAsync);
    const { data: importData, mapping } = body;
    const userId = event.context.auth.id;
    const empresaId = event.context.auth.empresa_id;

    let selectedBoard: {
      id: number;
      titulo: string;
      controle_lembretes: boolean;
    } | null = null;
    let moveReason: { motivo: string | null; motivoObservacao: string | null } = {
      motivo: null,
      motivoObservacao: null,
    };

    if (body.create_opportunities) {
      selectedBoard = await prisma.boardOportunidade.findFirst({
        where: {
          id: body.board_id!,
          empresa_id: empresaId,
        },
        select: {
          id: true,
          titulo: true,
          controle_lembretes: true,
        },
      });

      if (!selectedBoard) throw new Error("Status de oportunidade não encontrado");

      moveReason = await validateBoardMoveReason(prisma, {
        targetBoardId: selectedBoard.id,
        previousBoardId: null,
        empresaId,
        motivo: body.motivo,
        motivoObservacao: body.motivo_observacao,
      });
    }

    const result: ImportResult = {
      success: 0,
      errors: 0,
      opportunitiesCreated: 0,
      errorDetails: [],
    };

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];

      try {
        const leadData: Record<string, any> = {};
        const locationsData: Record<string, Record<string, string>> = {};

        Object.entries(mapping).forEach(([systemField, fileField]) => {
          const value = row[fileField];
          if (value === undefined || value === null || value === "") return;

          const trimmedValue = String(value).trim();
          const locationMatch = systemField.match(
            /^(rua|numero|cidade|complemento|estado|cep)(?:_(\d+))?$/,
          );

          if (locationMatch) {
            const [, fieldName, index] = locationMatch;
            const locationIndex = index || "1";
            if (!locationsData[locationIndex]) locationsData[locationIndex] = {};
            locationsData[locationIndex][fieldName] = trimmedValue;
            return;
          }

          if (!allowedLeadFields.has(systemField)) return;

          if (systemField === "num_funcionarios") {
            const numValue = Number.parseInt(trimmedValue, 10);
            if (!Number.isNaN(numValue)) leadData[systemField] = numValue;
            return;
          }

          leadData[systemField] = trimmedValue;
        });

        if (!leadData.nome_lead && !leadData.cpf_cnpj && !leadData.contato) {
          throw new Error(
            "Pelo menos um dos campos (Nome, CPF/CNPJ ou Contato) deve ser preenchido",
          );
        }

        const cpfCnpj = normalizeCpfCnpj(leadData.cpf_cnpj);

        const transactionResult = await prisma.$transaction(async (tx) => {
          if (cpfCnpj) {
            const existingLead = await tx.lead.findFirst({
              where: { cpf_cnpj: cpfCnpj, empresa_id: empresaId },
              select: { id: true, nome_lead: true },
            });

            if (existingLead) {
              throw new Error(
                `${buildDuplicateLeadMessage(existingLead.nome_lead)} Lead existente #${existingLead.id}`,
              );
            }
          }

          const createdLead = await tx.lead.create({
            data: {
              ...(leadData as Prisma.LeadUncheckedCreateInput),
              cpf_cnpj: cpfCnpj,
              usuario_id: userId,
              empresa_id: empresaId,
            },
          });

          const locations = Object.values(locationsData).filter((location) =>
            Object.values(location).some((value) => value.trim() !== ""),
          );

          if (locations.length) {
            await tx.localizacao.createMany({
              data: locations.map((location) => ({
                ...location,
                lead_id: createdLead.id,
              })),
            });
          }

          if (!selectedBoard) {
            return {
              leadId: createdLead.id,
              oportunidade: null,
              boardAssignment: null,
            };
          }

          const minPosicaoOportunidade = await tx.oportunidade.findFirst({
            orderBy: { posicao: "asc" },
            select: { posicao: true },
          });

          const oportunidade = await tx.oportunidade.create({
            data: {
              tipo: "Lead importado",
              descricao: `Oportunidade criada automaticamente pela importação em massa no status ${selectedBoard.titulo}.`,
              posicao: minPosicaoOportunidade
                ? minPosicaoOportunidade.posicao - 0.0001
                : 0,
              controle_lembretes: selectedBoard.controle_lembretes,
              lead_id: createdLead.id,
              usuario_id: userId,
              board_id: selectedBoard.id,
            },
            select: {
              id: true,
              board_id: true,
              posicao: true,
            },
          });

          await tx.oportunidadeResponsaveis.create({
            data: {
              oportunidade_id: oportunidade.id,
              usuario_id: userId,
              principal: true,
              gerencia_responsaveis: false,
              pode_editar: true,
              pode_interacoes: true,
              pode_visitas: true,
            },
          });

          const boardAssignment = await applyBoardAssignedUserToOpportunity(
            tx,
            oportunidade.id,
            oportunidade.board_id,
          );

          await tx.oportunidadeHistorico.create({
            data: {
              board_id: oportunidade.board_id,
              posicao: oportunidade.posicao,
              acao: "CREATE",
              motivo: moveReason.motivo,
              motivo_observacao: moveReason.motivoObservacao,
              descricao: "Oportunidade criada automaticamente pela importação em massa",
              oportunidade_id: oportunidade.id,
              usuario_id: userId,
            },
          });

          return {
            leadId: createdLead.id,
            oportunidade,
            boardAssignment,
          };
        });

        result.success++;

        if (transactionResult.oportunidade) {
          result.opportunitiesCreated++;

          publishOpportunityBoardStream(empresaId, {
            type: "board_card_created",
            payload: {
              oportunidadeId: transactionResult.oportunidade.id,
              previousBoardId: null,
              boardId: transactionResult.oportunidade.board_id,
              posicao: transactionResult.oportunidade.posicao,
              actorUserId: userId,
              updatedAt: new Date().toISOString(),
            },
          });

          const assignment = transactionResult.boardAssignment;
          if (
            assignment &&
            assignment.assignedUserId !== userId &&
            (assignment.grantedManagement || assignment.createdResponsavel)
          ) {
            try {
              await notifyOpportunityAssignment(prisma, {
                oportunidadeId: transactionResult.oportunidade.id,
                actorUserId: userId,
                assignedUserIds: [assignment.assignedUserId],
                source: "board",
              });
            } catch (notificationError) {
              console.error("Erro ao notificar responsável da oportunidade:", notificationError);
            }
          }
        }
      } catch (error: any) {
        result.errors++;
        result.errorDetails.push(`Linha ${i + 1}: ${error.message}`);
        console.error(`Erro na linha ${i + 1}:`, error);
      }
    }

    await logger.create(
      event,
      JSON.stringify({
        action: "LEADS_IMPORT",
        success: result.success,
        errors: result.errors,
        opportunitiesCreated: result.opportunitiesCreated,
        boardId: selectedBoard?.id ?? null,
      }),
    );

    return {
      data: result,
      message: `Importação concluída. ${result.success} leads importados com sucesso${
        result.errors > 0 ? `, ${result.errors} com erros` : ""
      }.`,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao importar os dados",
    });
  }
});
