import prisma from "@/lib/prisma";
import { settlementSchema } from "@/server/utils/financeiro-schemas";
import { nextMonthlyDate, nullableText, parseDateOnly, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId, userId } = requireFinancialAccess(event);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const body = await readValidatedBody(event, settlementSchema.parseAsync);

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.contaPagar.findFirst({ where: { id, empresa_id: companyId } });
    if (!account) throw createError({ statusCode: 404, message: "Conta a pagar não encontrada." });
    if (account.status !== "pendente") throw createError({ statusCode: 409, message: "Esta conta não está pendente." });

    const updated = await tx.contaPagar.update({
      where: { id },
      data: { status: "pago", data_pagamento: parseDateOnly(body.data), forma_pagamento: body.forma, banco: nullableText(body.banco) },
    });
    if (account.recorrente) {
      await tx.contaPagar.create({
        data: {
          descricao: account.descricao, fornecedor: account.fornecedor, responsavel: account.responsavel,
          valor: account.valor, data_vencimento: nextMonthlyDate(account.data_vencimento), status: "pendente",
          forma_pagamento: body.forma, banco: nullableText(body.banco), recorrente: true,
          categoria: account.categoria, observacoes: account.observacoes, empresa_id: companyId, criado_por: userId,
        },
      });
    }
    return updated;
  });
  await logger.update(event, JSON.stringify({ modulo: "financeiro", tipo: "pagamento", id }));
  return serializeFinancialRecord(result);
});
