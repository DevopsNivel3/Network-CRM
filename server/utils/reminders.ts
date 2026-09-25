import dayjs from "dayjs";

export const REMINDER_INTERVALS = [3, 7, 10, 15, 21];
export const DEFAULT_REMINDER_INTERVALS = REMINDER_INTERVALS;

export type ReminderUrgencyLevel = "critico" | "alto" | "medio" | "baixo" | "planejado";

export function getUrgencyLevel(daysSince: number, maxInterval: number): ReminderUrgencyLevel {
  if (daysSince > maxInterval + 7) return "critico";
  if (daysSince > maxInterval) return "alto";
  if (daysSince > maxInterval / 2) return "medio";
  if (daysSince > 0) return "baixo";
  return "planejado";
}

export function sanitizeReminderIntervals(intervals: any[]): number[] {
  if (!Array.isArray(intervals)) return [];
  const parsed = intervals.map((v) => Number(v)).filter((v) => !isNaN(v) && v > 0);
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

export function generateReminderDates(baseDate: Date = new Date()) {
  return REMINDER_INTERVALS.map(days => {
    return {
      dias: days,
      data_vencimento: dayjs(baseDate).add(days, 'day').toDate()
    };
  });
}

export function determinePriority(days: number) {
  if (days <= 3) return "Alta";
  if (days <= 10) return "Media";
  return "Baixa";
}
