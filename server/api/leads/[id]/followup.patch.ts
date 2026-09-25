import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const db = prisma as any;

    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.LEAD_EDIT))
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
    const body = await readValidatedBody(event, updateLeadFollowUpBodySchema.parseAsync);
    const where: Prisma.LeadWhereUniqueInput = { id };

    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      where.usuario_id = event.context.auth.id;
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN))
      where.empresa_id = event.context.auth.empresa_id;

    const lead = await db.lead.findUnique({
      where,
      select: {
        id: true,
        nome_lead: true,
      },
    });

    if (!lead) throw new Error("Lead não encontrado");

    let followUpDate: Date | null = null;

    if (!body.limpar) {
      if (body.intervalo_dias) followUpDate = dayjs().add(body.intervalo_dias, "day").toDate();
      if (body.data) followUpDate = dayjs(body.data).toDate();
    }

    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: {
        proximo_followup_em: followUpDate,
      },
      select: {
        id: true,
        proximo_followup_em: true,
      },
    });

    await db.leadInteracao.create({
      data: {
        lead_id: lead.id,
        usuario_id: event.context.auth.id,
        tipo: "NOTE",
        descricao: body.limpar
          ? "Agendamento de follow-up removido"
          : `Próximo follow-up agendado para ${dayjs(followUpDate).format("DD/MM/YYYY [às] HH:mm")}`,
        origem: "SYSTEM",
      },
    });

    return updatedLead;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao agendar o follow-up",
    });
  }
});
