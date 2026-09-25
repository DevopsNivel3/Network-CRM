import prisma from "~/lib/prisma";
import { z } from "zod";
import { generateReminderDates, determinePriority } from "@/server/utils/reminders";

export const createLeadInteracaoBodySchema = z.object({
  tipo: z.string(),
  descricao: z.string().nullable().optional(),
  data_interacao: z.string().nullable().optional(),
});

// Rota para adicionar uma interação a um lead
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      createLeadInteracaoBodySchema.parseAsync,
    );

    const dataInteracao = body.data_interacao ? new Date(body.data_interacao) : new Date();

    const interacao = await prisma.leadInteracao.create({
      data: {
        tipo: body.tipo,
        descricao: body.descricao || null,
        data_interacao: dataInteracao,
        lead_id: id,
        usuario_id: event.context.auth.id,
        empresa_id: event.context.auth.empresa_id,
      },
      include: {
        usuario: {
          select: {
            nome: true,
            avatar: true,
          },
        },
      },
    });

    // Generate reminders
    const lembretesData = generateReminderDates(dataInteracao);
    
    // First, complete or cancel older pending auto-generated reminders for this lead?
    // Let's mark pending ones as Concluido if they are for the same lead.
    await prisma.lembrete.updateMany({
      where: {
        lead_id: Number(id),
        status: "Pendente",
        tipo: "Follow-up",
      },
      data: {
        status: "Cancelado", // Or 'Concluido' based on new interaction
      }
    });

    await prisma.lembrete.createMany({
      data: lembretesData.map(rem => ({
        lead_id: Number(id),
        usuario_id: event.context.auth.id,
        empresa_id: event.context.auth.empresa_id,
        tipo: "Follow-up",
        descricao: `Follow-up automático de ${rem.dias} dias`,
        data_vencimento: rem.data_vencimento,
        prioridade: determinePriority(rem.dias),
        status: "Pendente"
      }))
    });

    await logger.create(event, JSON.stringify(interacao));

    return interacao;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao adicionar a interação ao lead",
    });
  }
});