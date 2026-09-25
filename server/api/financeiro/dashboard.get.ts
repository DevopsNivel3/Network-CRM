import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { normalizePermissionModules } from "@/utils/permissions";
import {
  formatDateOnly,
  parseDateOnly,
  requireFinancialAccess,
} from "@/server/utils/financeiro";

const querySchema = z.object({
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  agrupamento: z.enum(["diario", "mensal"]).default("diario"),
});

const numberValue = (value: unknown) => Number(value || 0);

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const enabledModules = normalizePermissionModules(
    event.context.auth?.empresa?.modulos,
  );

  if (!enabledModules.includes("FINANCEIRO")) {
    throw createError({
      statusCode: 403,
      message: "O módulo Financeiro não está habilitado para esta empresa.",
    });
  }

  const query = await getValidatedQuery(event, querySchema.parseAsync);
  const start = parseDateOnly(query.data_inicio);
  const end = parseDateOnly(query.data_fim);

  if (start > end) {
    throw createError({ statusCode: 400, message: "Período financeiro inválido." });
  }

  const dateRange: Prisma.DateTimeFilter = { gte: start, lte: end };
  const today = parseDateOnly(dayjs().format("YYYY-MM-DD"));

  const [
    receivablePending,
    receivableReceived,
    payablePending,
    payablePaid,
    receivableOverdue,
    payableOverdue,
    receivedEntries,
    paidEntries,
  ] = await Promise.all([
    prisma.contaReceber.aggregate({
      where: { empresa_id: companyId, status: "pendente", data_vencimento: dateRange },
      _sum: { valor: true },
      _count: { _all: true },
    }),
    prisma.contaReceber.aggregate({
      where: { empresa_id: companyId, status: "recebido", data_recebimento: dateRange },
      _sum: { valor: true },
      _count: { _all: true },
    }),
    prisma.contaPagar.aggregate({
      where: { empresa_id: companyId, status: "pendente", data_vencimento: dateRange },
      _sum: { valor: true },
      _count: { _all: true },
    }),
    prisma.contaPagar.aggregate({
      where: { empresa_id: companyId, status: "pago", data_pagamento: dateRange },
      _sum: { valor: true },
      _count: { _all: true },
    }),
    prisma.contaReceber.aggregate({
      where: {
        empresa_id: companyId,
        status: "pendente",
        data_vencimento: { ...dateRange, lt: today },
      },
      _sum: { valor: true },
      _count: { _all: true },
    }),
    prisma.contaPagar.aggregate({
      where: {
        empresa_id: companyId,
        status: "pendente",
        data_vencimento: { ...dateRange, lt: today },
      },
      _sum: { valor: true },
      _count: { _all: true },
    }),
    prisma.contaReceber.findMany({
      where: { empresa_id: companyId, status: "recebido", data_recebimento: dateRange },
      select: { valor: true, data_recebimento: true },
    }),
    prisma.contaPagar.findMany({
      where: { empresa_id: companyId, status: "pago", data_pagamento: dateRange },
      select: { valor: true, data_pagamento: true },
    }),
  ]);

  const keyFormat = query.agrupamento === "mensal" ? "YYYY-MM" : "YYYY-MM-DD";
  const labelFormat = query.agrupamento === "mensal" ? "MM/YYYY" : "DD/MM";
  const cursorUnit = query.agrupamento === "mensal" ? "month" : "day";
  const startCursor = dayjs(query.data_inicio).startOf(cursorUnit);
  const endCursor = dayjs(query.data_fim).startOf(cursorUnit);
  const bucketCount = endCursor.diff(startCursor, cursorUnit) + 1;
  const buckets = new Map<string, { entrada: number; saida: number }>();
  const categories: string[] = [];

  for (let index = 0; index < bucketCount; index += 1) {
    const cursor = startCursor.add(index, cursorUnit);
    buckets.set(cursor.format(keyFormat), { entrada: 0, saida: 0 });
    categories.push(cursor.format(labelFormat));
  }

  receivedEntries.forEach((item) => {
    const key = dayjs(formatDateOnly(item.data_recebimento)).format(keyFormat);
    const bucket = buckets.get(key);
    if (bucket) bucket.entrada += numberValue(item.valor);
  });

  paidEntries.forEach((item) => {
    const key = dayjs(formatDateOnly(item.data_pagamento)).format(keyFormat);
    const bucket = buckets.get(key);
    if (bucket) bucket.saida += numberValue(item.valor);
  });

  const bucketValues = [...buckets.values()];
  const totalReceived = numberValue(receivableReceived._sum.valor);
  const totalPaid = numberValue(payablePaid._sum.valor);

  return {
    period: { start: query.data_inicio, end: query.data_fim },
    totals: {
      receivable: numberValue(receivablePending._sum.valor),
      received: totalReceived,
      payable: numberValue(payablePending._sum.valor),
      paid: totalPaid,
      balance: totalReceived - totalPaid,
      receivableOverdue: numberValue(receivableOverdue._sum.valor),
      payableOverdue: numberValue(payableOverdue._sum.valor),
    },
    counts: {
      receivable: receivablePending._count._all,
      received: receivableReceived._count._all,
      payable: payablePending._count._all,
      paid: payablePaid._count._all,
      receivableOverdue: receivableOverdue._count._all,
      payableOverdue: payableOverdue._count._all,
    },
    cashFlow: {
      granularity: query.agrupamento,
      categories,
      series: [
        { name: "Entradas", data: bucketValues.map((item) => item.entrada) },
        { name: "Saídas", data: bucketValues.map((item) => item.saida) },
      ],
    },
  };
});
