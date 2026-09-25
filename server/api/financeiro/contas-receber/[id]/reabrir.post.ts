import prisma from "@/lib/prisma";
import { reopenSettlementSchema } from "@/server/utils/financeiro-schemas";
import { requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const body = await readValidatedBody(event, reopenSettlementSchema.parseAsync);

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.contaReceber.findFirst({
      where: { id, empresa_id: companyId },
      include: { lead: { select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true } } },
    });
    if (!account) throw createError({ statusCode: 404, message: "Conta a receber não encontrada." });
    if (account.status !== "recebido") throw createError({ statusCode: 409, message: "Somente recebimentos confirmados podem ser reabertos." });

    const updated = await tx.contaReceber.update({
      where: { id },
      data: { status: "pendente", data_recebimento: null },
      include: { lead: { select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true } } },
    });
    return { updated, previous: account };
  });

  await logger.update(event, JSON.stringify({
    modulo: "financeiro",
    tipo: "reabertura_recebimento",
    id,
    motivo: body.motivo,
    baixa_anterior: {
      data_recebimento: result.previous.data_recebimento,
      forma_recebimento: result.previous.forma_recebimento,
      banco: result.previous.banco,
      valor: Number(result.previous.valor),
    },
  }));
  return serializeFinancialRecord(result.updated);
});
