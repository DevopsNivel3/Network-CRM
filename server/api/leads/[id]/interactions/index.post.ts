import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registerLeadInteraction } from "@/server/utils/lead-interactions";

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.LEAD_EDIT))
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
    const body = await readValidatedBody(event, createLeadInteractionBodySchema.parseAsync);
    const where: Prisma.LeadWhereUniqueInput = { id };

    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      where.usuario_id = event.context.auth.id;
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN))
      where.empresa_id = event.context.auth.empresa_id;

    const lead = await prisma.lead.findUnique({
      where,
      select: { id: true },
    });
    if (!lead) throw new Error("Lead não encontrado");

    await registerLeadInteraction({
      leadId: lead.id,
      userId: event.context.auth.id,
      type: body.tipo,
      description: body.descricao,
      source: body.origem || "MANUAL",
    });

    return true;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao registrar interação",
    });
  }
});

