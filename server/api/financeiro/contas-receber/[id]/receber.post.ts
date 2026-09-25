import prisma from "@/lib/prisma";
import { settlementSchema } from "@/server/utils/financeiro-schemas";
import { nextMonthlyDate, nullableText, parseDateOnly, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId, userId } = requireFinancialAccess(event);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const body = await readValidatedBody(event, settlementSchema.parseAsync);
  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.contaReceber.findFirst({ where: { id, empresa_id: companyId } });
    if (!account) throw createError({ statusCode: 404, message: "Conta a receber não encontrada." });
    if (account.status !== "pendente") throw createError({ statusCode: 409, message: "Esta conta não está pendente." });
    const updated = await tx.contaReceber.update({
      where: { id },
      data: { status: "recebido", data_recebimento: parseDateOnly(body.data), forma_recebimento: body.forma, banco: nullableText(body.banco) },
      include: { lead: { select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true } } },
    });
    if (account.recorrente) {
      const nextDueDate = nextMonthlyDate(account.data_vencimento);
      const existingNextAccount = await tx.contaReceber.findFirst({
        where: { empresa_id: companyId, lead_id: account.lead_id, descricao: account.descricao, data_vencimento: nextDueDate, recorrente: true, id: { not: account.id } },
        select: { id: true },
      });
      if (!existingNextAccount) {
        await tx.contaReceber.create({
          data: {
            descricao: account.descricao, lead_id: account.lead_id, responsavel: account.responsavel,
            valor: account.valor, data_vencimento: nextDueDate, status: "pendente",
            forma_recebimento: body.forma, banco: nullableText(body.banco), recorrente: true,
            categoria: account.categoria, observacoes: account.observacoes, empresa_id: companyId, criado_por: userId,
          },
        });
      }
    }
    return updated;
  });
  await logger.update(event, JSON.stringify({ modulo: "financeiro", tipo: "recebimento", id }));
  return serializeFinancialRecord(result);
});
