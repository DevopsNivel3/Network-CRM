import prisma from "@/lib/prisma";
import { DEFAULT_REMINDER_INTERVALS, sanitizeReminderIntervals } from "@/server/utils/reminders";

export default defineEventHandler(async (event) => {
  try {
    const db = prisma as any;
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.LEAD_VIEW))
      throw new Error("Você não tem permissão suficiente");

    const config = await db.lembreteConfig.findUnique({
      where: { empresa_id: event.context.auth.empresa_id },
      select: {
        intervalos_dias: true,
        atualizado: true,
      },
    });

    const intervalos = sanitizeReminderIntervals((config?.intervalos_dias as number[]) || []);

    return {
      intervalos: intervalos.length ? intervalos : DEFAULT_REMINDER_INTERVALS,
      atualizado: config?.atualizado || null,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar configuração de lembretes",
    });
  }
});

