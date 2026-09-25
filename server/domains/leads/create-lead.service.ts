import prisma from "@/lib/prisma";
import { applyBoardAssignedUserToOpportunity } from "@/server/utils/board-assignment";
import { notifyOpportunityAssignment } from "@/server/utils/opportunity-notifications";
import type { CreateLeadInput } from "./create-lead.schema";
import { findOrCreateOpportunityBoard } from "./opportunity-board.service";

const hasLocationData = (location: CreateLeadInput["localizacoes"][number]) =>
  Object.values({
    rua: location.rua?.trim() || "",
    cidade: location.cidade?.trim() || "",
    estado: location.estado?.trim() || "",
    complemento: location.complemento?.trim() || "",
    numero: location.numero?.trim() || "",
    cep: location.cep?.trim() || "",
  }).some(Boolean);

async function resolveGroupIds(
  groupIds: number[] | undefined,
  companyId: number,
) {
  if (!groupIds?.length) return [];
  const groups = await prisma.leadGrupo.findMany({
    where: { id: { in: groupIds }, empresa_id: companyId },
    select: { id: true },
  });
  if (!groups.length) throw new Error("Nenhum grupo válido encontrado");
  return groups.map((group) => group.id);
}

export async function createLead(
  input: CreateLeadInput & { cpf_cnpj: string | null },
  actor: { userId: number; companyId: number },
) {
  const groupIds = await resolveGroupIds(input.grupo_ids, actor.companyId);
  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        nome_lead: input.nome_lead,
        cpf_cnpj: input.cpf_cnpj,
        contato_nome: input.contato_nome,
        contato: input.contato,
        responsavel: input.responsavel,
        atividade: input.atividade,
        faturamento: input.faturamento,
        num_funcionarios: input.num_funcionarios,
        observacoes: input.observacoes,
        origem_lead: input.origem_lead,
        controle_lembretes: input.controle_lembretes,
        localizacoes: {
          create: input.localizacoes
            .filter(hasLocationData)
            .map(({ key: _key, ...location }) => location),
        },
        ...(groupIds.length
          ? {
              grupos: {
                createMany: {
                  data: groupIds.map((grupo_id) => ({ grupo_id })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
        usuario: { connect: { id: actor.userId } },
        empresa: { connect: { id: actor.companyId } },
      },
    });

    if (!input.classificacao_oportunidade) {
      return { lead, oportunidadeId: null, boardAssignment: null };
    }

    const board = await findOrCreateOpportunityBoard(
      tx,
      actor.companyId,
      input.classificacao_oportunidade,
    );
    const firstOpportunity = await tx.oportunidade.findFirst({
      orderBy: { posicao: "asc" },
      select: { posicao: true },
    });
    const opportunity = await tx.oportunidade.create({
      data: {
        tipo: `Lead ${input.classificacao_oportunidade}`,
        descricao: `Oportunidade criada automaticamente a partir do cadastro do lead (${input.classificacao_oportunidade}).`,
        posicao: firstOpportunity ? firstOpportunity.posicao - 0.0001 : 0,
        controle_lembretes: input.controle_lembretes,
        lead: { connect: { id: lead.id } },
        board: { connect: { id: board.id } },
        usuario: { connect: { id: actor.userId } },
      },
      select: { id: true, board_id: true, posicao: true },
    });
    await tx.oportunidadeResponsaveis.create({
      data: {
        oportunidade_id: opportunity.id,
        usuario_id: actor.userId,
        principal: true,
        gerencia_responsaveis: false,
        pode_editar: true,
        pode_interacoes: true,
        pode_visitas: true,
      },
    });
    const boardAssignment = await applyBoardAssignedUserToOpportunity(
      tx,
      opportunity.id,
      opportunity.board_id,
    );
    await tx.oportunidadeHistorico.create({
      data: {
        board_id: opportunity.board_id,
        posicao: opportunity.posicao,
        acao: "CREATE",
        descricao: "Oportunidade criada automaticamente pelo cadastro de lead",
        oportunidade: { connect: { id: opportunity.id } },
        usuario: { connect: { id: actor.userId } },
      },
    });
    return { lead, oportunidadeId: opportunity.id, boardAssignment };
  });

  if (
    result.oportunidadeId &&
    (result.boardAssignment?.grantedManagement ||
      result.boardAssignment?.createdResponsavel)
  ) {
    await notifyOpportunityAssignment(prisma, {
      oportunidadeId: result.oportunidadeId,
      actorUserId: actor.userId,
      assignedUserIds: [result.boardAssignment.assignedUserId],
      source: "board",
    });
  }
  return result;
}
