import prisma from "@/lib/prisma";
import { requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const result = await prisma.contaReceber.updateMany({ where: { id, empresa_id: companyId, status: "pendente" }, data: { status: "cancelado" } });
  if (!result.count) throw createError({ statusCode: 409, message: "A conta não existe ou não está pendente." });
  const data = await prisma.contaReceber.findUniqueOrThrow({ where: { id }, include: { lead: { select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true } } } });
  await logger.update(event, JSON.stringify({ modulo: "financeiro", tipo: "cancelamento_conta_receber", id }));
  return serializeFinancialRecord(data);
});
