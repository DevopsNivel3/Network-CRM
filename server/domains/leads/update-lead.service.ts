import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { UpdateLeadInput } from "./update-lead.schema";
import type { DuplicateLeadDetails } from "./lead-duplicate.service";

interface UpdateLeadActor {
  userId: number;
  userName?: string | null;
  companyId: number;
  isAdmin: boolean;
  isGrantAdmin: boolean;
}

export class LeadNotFoundError extends Error {}

const buildAccessWhere = (id: number, actor: UpdateLeadActor) => {
  const where: Prisma.LeadWhereUniqueInput = { id };
  if (!actor.isGrantAdmin) where.empresa_id = actor.companyId;
  if (!actor.isAdmin && !actor.isGrantAdmin) where.usuario_id = actor.userId;
  return where;
};

async function findDuplicate(
  id: number,
  cpfCnpj: string,
  companyId: number,
  input: UpdateLeadInput,
  actor: UpdateLeadActor,
): Promise<DuplicateLeadDetails | null> {
  const duplicate = await prisma.lead.findFirst({
    where: { cpf_cnpj: cpfCnpj, id: { not: id }, empresa_id: companyId },
    select: {
      id: true,
      nome_lead: true,
      cpf_cnpj: true,
      atualizado: true,
      usuario: { select: { id: true, nome: true, email: true } },
      _count: { select: { comentarios: true, oportunidades: true } },
    },
  });
  if (!duplicate) return null;

  await prisma.leadComentarios.create({
    data: {
      descricao: [
        "Tentativa de edição com CNPJ/CPF duplicado bloqueada automaticamente.",
        `CNPJ/CPF informado: ${cpfCnpj}.`,
        `Lead que estava sendo editado: #${id}.`,
        `Nome informado na edição: ${input.nome_lead || "Não informado"}.`,
        `Usuário que tentou editar: ${actor.userName || `#${actor.userId}`}.`,
      ].join("\n"),
      lead_id: duplicate.id,
      usuario_id: actor.userId,
    },
  });
  const message = `Já existe um lead cadastrado com este CPF/CNPJ${duplicate.nome_lead ? `: ${duplicate.nome_lead}` : "."}`;
  return {
    message,
    lead: {
      id: duplicate.id,
      nome: duplicate.nome_lead,
      cpf_cnpj: duplicate.cpf_cnpj,
      atualizado: duplicate.atualizado,
      comentarios: duplicate._count.comentarios,
      oportunidades: duplicate._count.oportunidades,
    },
    owner: duplicate.usuario
      ? {
          id: duplicate.usuario.id,
          nome: duplicate.usuario.nome,
          email: duplicate.usuario.email,
        }
      : null,
  };
}

async function resolveGroupIds(input: UpdateLeadInput, actor: UpdateLeadActor) {
  if (input.grupo_ids === undefined) return null;
  if (!input.grupo_ids?.length) return [];
  const groups = await prisma.leadGrupo.findMany({
    where: {
      id: { in: input.grupo_ids },
      ...(actor.isGrantAdmin ? {} : { empresa_id: actor.companyId }),
    },
    select: { id: true },
  });
  if (!groups.length) throw new Error("Nenhum grupo válido encontrado");
  return groups.map((group) => group.id);
}

function buildLocationMutation(
  existing: Array<{
    id: number;
    rua: string | null;
    cidade: string | null;
    estado: string | null;
    complemento: string | null;
    numero: string | null;
    cep: string | null;
  }>,
  locations: NonNullable<UpdateLeadInput["localizacoes"]>,
) {
  const incomingById = new Map(
    locations.filter((item) => item.id).map((item) => [item.id!, item]),
  );
  const existingIds = new Set(existing.map((item) => item.id));
  return {
    deleteMany: {
      id: {
        in: existing
          .filter((item) => !incomingById.has(item.id))
          .map((item) => item.id),
      },
    },
    updateMany: existing
      .filter((item) => incomingById.has(item.id))
      .map((item) => {
        const incoming = incomingById.get(item.id)!;
        return {
          where: { id: item.id },
          data: {
            rua: incoming.rua || item.rua,
            cidade: incoming.cidade || item.cidade,
            estado: incoming.estado || item.estado,
            complemento: incoming.complemento || null,
            numero: incoming.numero || item.numero,
            cep: incoming.cep || item.cep,
          },
        };
      }),
    create: locations
      .filter((item) => !item.id || !existingIds.has(item.id))
      .map(({ id: _id, key: _key, ...item }) => item),
  };
}

export async function updateLead(
  id: number,
  input: UpdateLeadInput & { cpf_cnpj: string | null },
  actor: UpdateLeadActor,
) {
  const where = buildAccessWhere(id, actor);
  const existing = await prisma.lead.findFirst({
    where,
    select: {
      empresa_id: true,
      localizacoes: {
        select: {
          id: true,
          rua: true,
          cidade: true,
          estado: true,
          complemento: true,
          numero: true,
          cep: true,
        },
      },
    },
  });
  if (!existing) throw new LeadNotFoundError("Lead não encontrado");

  if (input.cpf_cnpj) {
    const duplicate = await findDuplicate(
      id,
      input.cpf_cnpj,
      existing.empresa_id,
      input,
      actor,
    );
    if (duplicate) return { kind: "duplicate" as const, duplicate };
  }

  const groupIds = await resolveGroupIds(input, actor);
  const updated = await prisma.lead.update({
    where,
    data: {
      nome_lead: input.nome_lead,
      contato_nome: input.contato_nome,
      cpf_cnpj: input.cpf_cnpj,
      contato: input.contato,
      atividade: input.atividade,
      faturamento: input.faturamento,
      origem_lead: input.origem_lead,
      responsavel: input.responsavel,
      num_funcionarios: input.num_funcionarios,
      observacoes: input.observacoes,
      controle_lembretes: input.controle_lembretes,
      ...(input.localizacoes
        ? {
            localizacoes: buildLocationMutation(
              existing.localizacoes,
              input.localizacoes,
            ),
          }
        : {}),
      ...(groupIds !== null
        ? {
            grupos: groupIds.length
              ? {
                  deleteMany: { grupo_id: { notIn: groupIds } },
                  createMany: {
                    data: groupIds.map((grupo_id) => ({ grupo_id })),
                    skipDuplicates: true,
                  },
                }
              : { deleteMany: {} },
          }
        : {}),
    },
    select: {
      id: true,
      nome_lead: true,
      cpf_cnpj: true,
      responsavel: true,
      contato_nome: true,
      contato: true,
      atividade: true,
      faturamento: true,
      num_funcionarios: true,
      origem_lead: true,
      observacoes: true,
      controle_lembretes: true,
      criado: true,
      atualizado: true,
      usuario: { select: { nome: true, avatar: true } },
      localizacoes: true,
      grupos: {
        select: {
          grupo: { select: { id: true, nome: true, descricao: true } },
        },
      },
    },
  });
  if (input.controle_lembretes === false) {
    await prisma.lembrete.deleteMany({ where: { lead_id: id } });
  }
  return {
    kind: "updated" as const,
    lead: { ...updated, grupos: updated.grupos.map((item) => item.grupo) },
  };
}
