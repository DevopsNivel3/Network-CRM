import prisma from "@/lib/prisma";
import { DEFAULT_REMINDER_INTERVALS, sanitizeReminderIntervals } from "@/server/utils/reminders";

export default defineEventHandler(async (event) => {
  try {
    const db = prisma as any;
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN))
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(event, updateReminderIntervalsBodySchema.parseAsync);
    const intervalos = sanitizeReminderIntervals(body.intervalos);

    if (!intervalos.length) throw new Error("Nenhum intervalo válido foi informado");

    const config = await db.lembreteConfig.upsert({
      where: { empresa_id: event.context.auth.empresa_id },
      create: {
        empresa_id: event.context.auth.empresa_id,
        intervalos_dias: intervalos,
      },
      update: {
        intervalos_dias: intervalos,
      },
      select: {
        intervalos_dias: true,
        atualizado: true,
      },
    });

    return {
      intervalos: sanitizeReminderIntervals((config.intervalos_dias as number[]) || DEFAULT_REMINDER_INTERVALS),
      atualizado: config.atualizado,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao atualizar configuração de lembretes",
    });
  }
});

