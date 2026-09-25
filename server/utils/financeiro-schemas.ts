import { z } from "zod";
import { FORMAS_FINANCEIRAS, STATUS_PAGAR, STATUS_RECEBER } from "./financeiro";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");

export const financialFiltersSchema = z.object({
  status: z.enum(["todos", ...STATUS_PAGAR, ...STATUS_RECEBER]).optional().default("todos"),
  search: z.string().trim().max(255).optional(),
  forma: z.enum(["todos", ...FORMAS_FINANCEIRAS]).optional().default("todos"),
  data_inicio: dateOnly.optional(),
  data_fim: dateOnly.optional(),
});

export const payableBodySchema = z.object({
  descricao: z.string().trim().min(2).max(255),
  fornecedor: optionalText(150),
  responsavel: optionalText(150),
  valor: z.coerce.number().positive().max(9999999999.99),
  data_vencimento: dateOnly,
  forma_pagamento: z.enum(FORMAS_FINANCEIRAS).nullable().optional(),
  banco: optionalText(100),
  recorrente: z.boolean().optional().default(false),
  categoria: optionalText(80),
  observacoes: optionalText(10000),
});

export const receivableBodySchema = z.object({
  descricao: z.string().trim().min(2).max(255),
  lead_id: z.coerce.number().int().positive(),
  responsavel: optionalText(150),
  valor: z.coerce.number().positive().max(9999999999.99),
  data_vencimento: dateOnly,
  forma_recebimento: z.enum(FORMAS_FINANCEIRAS).nullable().optional(),
  banco: optionalText(100),
  recorrente: z.boolean().optional().default(false),
  categoria: optionalText(80),
  observacoes: optionalText(10000),
});

export const settlementSchema = z.object({
  data: dateOnly,
  forma: z.enum(FORMAS_FINANCEIRAS),
  banco: optionalText(100),
});

export const reopenSettlementSchema = z.object({
  motivo: z.string().trim().min(5, "Informe um motivo com pelo menos 5 caracteres.").max(1000),
});
