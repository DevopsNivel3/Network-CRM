import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { financialFiltersSchema } from "@/server/utils/financeiro-schemas";
import { financialDateFilter, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const query = await getValidatedQuery(event, financialFiltersSchema.parseAsync);
  const where: Prisma.ContaPagarWhereInput = { empresa_id: companyId };

  if (query.status !== "todos") where.status = query.status;
  if (query.forma !== "todos") where.forma_pagamento = query.forma;
  if (query.search) {
    where.OR = [
      { descricao: { contains: query.search } },
      { fornecedor: { contains: query.search } },
      { responsavel: { contains: query.search } },
    ];
  }
  const dateFilter = financialDateFilter(query.data_inicio, query.data_fim);
  if (dateFilter) where.data_vencimento = dateFilter;

  const data = await prisma.contaPagar.findMany({
    where,
    orderBy: [{ data_vencimento: "asc" }, { id: "desc" }],
    include: { criador: { select: { id: true, nome: true } } },
  });

  return { data: data.map(serializeFinancialRecord) };
});
