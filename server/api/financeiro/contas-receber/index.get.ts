import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { financialFiltersSchema } from "@/server/utils/financeiro-schemas";
import { financialDateFilter, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const query = await getValidatedQuery(event, financialFiltersSchema.parseAsync);
  const where: Prisma.ContaReceberWhereInput = { empresa_id: companyId };
  if (query.status !== "todos") where.status = query.status;
  if (query.forma !== "todos") where.forma_recebimento = query.forma;
  if (query.search) {
    where.OR = [
      { descricao: { contains: query.search } },
      { responsavel: { contains: query.search } },
      { lead: { nome_lead: { contains: query.search } } },
      { lead: { cpf_cnpj: { contains: query.search.replace(/\D/g, "") } } },
    ];
  }
  const dateFilter = financialDateFilter(query.data_inicio, query.data_fim);
  if (dateFilter) where.data_vencimento = dateFilter;

  const data = await prisma.contaReceber.findMany({
    where,
    orderBy: [{ data_vencimento: "asc" }, { id: "desc" }],
    include: {
      lead: { select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true } },
      criador: { select: { id: true, nome: true } },
    },
  });
  return { data: data.map(serializeFinancialRecord) };
});
