import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import prisma from "@/lib/prisma";
import {
  DEFAULT_REMINDER_INTERVALS,
  getUrgencyLevel,
  type ReminderUrgencyLevel,
  sanitizeReminderIntervals,
} from "@/server/utils/reminders";

const urgencyWeight = {
  critico: 5,
  alto: 4,
  medio: 3,
  baixo: 2,
  planejado: 1,
} as const;

export default defineEventHandler(async (event) => {
  try {
    const db = prisma as any;
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.LEAD_VIEW))
      throw new Error("Você não tem permissão suficiente");

    const page = Math.max(Number(getQuery(event)?.page || 1), 1);
    const perPage = Math.min(Math.max(Number(getQuery(event)?.perPage || 20), 1), 100);

    const where: Prisma.LeadWhereInput = {};

    if (
      hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN) ||
      hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN)
    ) {
      if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN))
        where.empresa_id = event.context.auth.empresa_id;
    } else {
      where.usuario_id = event.context.auth.id;
      where.empresa_id = event.context.auth.empresa_id;
    }

    const config = await db.lembreteConfig.findUnique({
      where: { empresa_id: event.context.auth.empresa_id },
      select: { intervalos_dias: true },
    });

    const intervals = sanitizeReminderIntervals((config?.intervalos_dias as number[]) || []);
    const activeIntervals = intervals.length ? intervals : DEFAULT_REMINDER_INTERVALS;
    const maxInterval = activeIntervals[activeIntervals.length - 1];

    const leads: any[] = await db.lead.findMany({
      where,
      select: {
        id: true,
        nome_lead: true,
        contato_nome: true,
        contato: true,
        criado: true,
        ultima_interacao_em: true,
        proximo_followup_em: true,
        usuario: {
          select: { id: true, nome: true },
        },
        localizacoes: {
          select: { cidade: true, estado: true },
          take: 1,
        },
        interacoes: {
          select: {
            tipo: true,
            criado: true,
          },
          orderBy: { criado: "desc" },
          take: 1,
        },
      },
    });

    const now = dayjs();
    const reminders = leads.map((lead) => {
      const baseDate = dayjs(lead.ultima_interacao_em || lead.interacoes[0]?.criado || lead.criado);
      const daysSince = Math.max(now.diff(baseDate, "day"), 0);
      const nextInterval = activeIntervals.find((interval) => daysSince < interval) || null;
      const referenceInterval = nextInterval || maxInterval;
      const dueAt = lead.proximo_followup_em
        ? dayjs(lead.proximo_followup_em)
        : baseDate.add(referenceInterval, "day");
      const overdueDays = Math.max(now.diff(dueAt, "day"), 0);
      const customSchedule = Boolean(lead.proximo_followup_em);
      const urgency: ReminderUrgencyLevel = customSchedule
        ? getUrgencyLevel(overdueDays, maxInterval)
        : getUrgencyLevel(daysSince, maxInterval);

      return {
        lead_id: lead.id,
        lead_nome: lead.nome_lead || "Sem nome",
        contato_nome: lead.contato_nome,
        contato: lead.contato,
        cidade: lead.localizacoes[0]?.cidade || null,
        estado: lead.localizacoes[0]?.estado || null,
        usuario: lead.usuario,
        dias_sem_interacao: daysSince,
        proximo_intervalo_dias: customSchedule ? null : nextInterval,
        prazo_em: dueAt.toDate(),
        dias_em_atraso: overdueDays,
        followup_personalizado: customSchedule,
        nivel_urgencia: urgency,
        ultima_interacao: {
          tipo: lead.interacoes[0]?.tipo || "NOTE",
          criado: lead.ultima_interacao_em || lead.interacoes[0]?.criado || lead.criado,
        },
      };
    });

    reminders.sort((a, b) => {
      const urgencyDiff = urgencyWeight[b.nivel_urgencia] - urgencyWeight[a.nivel_urgencia];
      if (urgencyDiff !== 0) return urgencyDiff;
      return dayjs(a.prazo_em).valueOf() - dayjs(b.prazo_em).valueOf();
    });

    const total = reminders.length;
    const totalPages = Math.ceil(total / perPage);
    const validPage = Math.min(Math.max(page, 1), totalPages || 1);
    const data = reminders.slice((validPage - 1) * perPage, validPage * perPage);

    return {
      intervalos: activeIntervals,
      data,
      total,
      page: validPage,
      totalPages,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar fila de lembretes",
    });
  }
});

