import prisma from "@/lib/prisma";
import type { CreateLeadInput } from "./create-lead.schema";

export interface DuplicateLeadDetails {
  message: string;
  lead: {
    id: number;
    nome: string;
    cpf_cnpj: string | null;
    atualizado: Date;
    comentarios: number;
    oportunidades: number;
  };
  owner: { id: number; nome: string; email: string } | null;
}

export async function registerDuplicateLeadAttempt(input: {
  cpfCnpj: string;
  companyId: number;
  userId: number;
  userName?: string | null;
  lead: CreateLeadInput;
}): Promise<DuplicateLeadDetails | null> {
  const existing = await prisma.lead.findFirst({
    where: { cpf_cnpj: input.cpfCnpj, empresa_id: input.companyId },
    select: {
      id: true,
      nome_lead: true,
      cpf_cnpj: true,
      atualizado: true,
      usuario: { select: { id: true, nome: true, email: true } },
      _count: { select: { comentarios: true, oportunidades: true } },
    },
  });
  if (!existing) return null;

  await prisma.leadComentarios.create({
    data: {
      descricao: [
        "Tentativa de cadastro duplicado bloqueada automaticamente.",
        `CNPJ/CPF informado: ${input.cpfCnpj}.`,
        `Nome informado no novo cadastro: ${input.lead.nome_lead || "Não informado"}.`,
        `Responsável informado no novo cadastro: ${input.lead.responsavel || "Não informado"}.`,
        `Usuário que tentou cadastrar: ${input.userName || `#${input.userId}`}.`,
      ].join("\n"),
      lead_id: existing.id,
      usuario_id: input.userId,
    },
  });

  const message = `Já existe um lead cadastrado com este CPF/CNPJ${existing.nome_lead ? `: ${existing.nome_lead}` : "."}`;
  return {
    message,
    lead: {
      id: existing.id,
      nome: existing.nome_lead,
      cpf_cnpj: existing.cpf_cnpj,
      atualizado: existing.atualizado,
      comentarios: existing._count.comentarios,
      oportunidades: existing._count.oportunidades,
    },
    owner: existing.usuario
      ? {
          id: existing.usuario.id,
          nome: existing.usuario.nome,
          email: existing.usuario.email,
        }
      : null,
  };
}
