import prisma from "@/lib/prisma";
import { payableBodySchema } from "@/server/utils/financeiro-schemas";
import { nullableText, parseDateOnly, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const body = await readValidatedBody(event, payableBodySchema.parseAsync);
  const existing = await prisma.contaPagar.findFirst({ where: { id, empresa_id: companyId } });
  if (!existing) throw createError({ statusCode: 404, message: "Conta a pagar não encontrada." });
  if (existing.status !== "pendente") throw createError({ statusCode: 409, message: "Somente contas pendentes podem ser editadas." });

  const data = await prisma.contaPagar.update({
    where: { id },
    data: {
      descricao: body.descricao,
      fornecedor: nullableText(body.fornecedor),
      responsavel: nullableText(body.responsavel),
      valor: body.valor,
      data_vencimento: parseDateOnly(body.data_vencimento),
      forma_pagamento: body.forma_pagamento || null,
      banco: nullableText(body.banco),
      recorrente: body.recorrente,
      categoria: nullableText(body.categoria),
      observacoes: nullableText(body.observacoes),
    },
  });
  await logger.update(event, JSON.stringify({ modulo: "financeiro", tipo: "conta_pagar", id }));
  return serializeFinancialRecord(data);
});
