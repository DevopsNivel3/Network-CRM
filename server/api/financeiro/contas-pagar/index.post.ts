import prisma from "@/lib/prisma";
import { payableBodySchema } from "@/server/utils/financeiro-schemas";
import { nullableText, parseDateOnly, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId, userId } = requireFinancialAccess(event);
  const body = await readValidatedBody(event, payableBodySchema.parseAsync);
  const data = await prisma.contaPagar.create({
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
      empresa_id: companyId,
      criado_por: userId,
    },
  });
  await logger.create(event, JSON.stringify({ modulo: "financeiro", tipo: "conta_pagar", id: data.id }));
  return serializeFinancialRecord(data);
});
