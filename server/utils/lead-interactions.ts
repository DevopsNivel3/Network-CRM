import prisma from "@/lib/prisma";
import type { LeadInteractionType } from "@/server/utils/reminders";

interface RegisterLeadInteractionInput {
  leadId: number;
  userId?: number;
  type: LeadInteractionType;
  description?: string | null;
  source?: string | null;
  createdAt?: Date;
  resetNextFollowUp?: boolean;
}

export async function registerLeadInteraction(input: RegisterLeadInteractionInput) {
  const db = prisma as any;
  const interactionDate = input.createdAt ?? new Date();

  await db.leadInteracao.create({
    data: {
      lead_id: input.leadId,
      usuario_id: input.userId,
      tipo: input.type,
      descricao: input.description || null,
      origem: input.source || "SYSTEM",
      criado: interactionDate,
    },
  });

  await db.lead.update({
    where: { id: input.leadId },
    data: {
      ultima_interacao_em: interactionDate,
      proximo_followup_em: input.resetNextFollowUp === false ? undefined : null,
    },
  });
}

