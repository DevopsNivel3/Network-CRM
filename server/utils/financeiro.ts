import type { H3Event } from "h3";
import type { Prisma } from "@prisma/client";
import { UserPermissions, hasUserPermission } from "./permissions";

export const FORMAS_FINANCEIRAS = [
  "dinheiro",
  "pix",
  "transferencia",
  "boleto",
  "cartao_credito",
  "cartao_debito",
  "outros",
] as const;

export const STATUS_PAGAR = ["pendente", "pago", "cancelado"] as const;
export const STATUS_RECEBER = ["pendente", "recebido", "cancelado"] as const;

export const requireFinancialAccess = (event: H3Event, adminOnly = false) => {
  const auth = event.context.auth as
    | { id?: number; empresa_id?: number; permissoes?: number }
    | undefined;

  if (!auth?.id || !auth.empresa_id) {
    throw createError({ statusCode: 403, message: "Empresa do usuário não identificada." });
  }

  const permission = adminOnly
    ? UserPermissions.ADMIN
    : UserPermissions.VER_FINANCEIRO;
  if (!hasUserPermission(Number(auth.permissoes || 0), permission)) {
    throw createError({ statusCode: 403, message: "Você não tem permissão para acessar o Financeiro." });
  }

  return { userId: auth.id, companyId: auth.empresa_id };
};

export const parseDateOnly = (value: string) => {
  const normalized = String(value || "").slice(0, 10);
  const date = new Date(`${normalized}T12:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw createError({ statusCode: 400, message: "Data inválida." });
  }
  return date;
};

export const formatDateOnly = (value?: Date | string | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};

export const nextMonthlyDate = (value: Date) => {
  const source = new Date(value);
  const originalDay = source.getUTCDate();
  const targetMonth = source.getUTCMonth() + 1;
  const targetYear = source.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = targetMonth % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(originalDay, lastDay), 12));
};

export const nullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

export const serializeFinancialRecord = <T extends Record<string, any>>(record: T) => ({
  ...record,
  valor: Number(record.valor || 0),
  data_vencimento: formatDateOnly(record.data_vencimento),
  data_pagamento: formatDateOnly(record.data_pagamento),
  data_recebimento: formatDateOnly(record.data_recebimento),
});

export const financialDateFilter = (start?: string, end?: string): Prisma.DateTimeFilter | undefined => {
  if (!start && !end) return undefined;
  return {
    ...(start ? { gte: parseDateOnly(start) } : {}),
    ...(end ? { lte: parseDateOnly(end) } : {}),
  };
};
