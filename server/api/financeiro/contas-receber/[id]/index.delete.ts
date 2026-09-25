import prisma from "@/lib/prisma";
import { requireFinancialAccess } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event, true);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const existing = await prisma.contaReceber.findFirst({ where: { id, empresa_id: companyId } });
  if (!existing) throw createError({ statusCode: 404, message: "Conta a receber não encontrada." });
  if (existing.status === "recebido") throw createError({ statusCode: 409, message: "Contas recebidas não podem ser excluídas; cancele somente lançamentos pendentes." });
  await prisma.contaReceber.delete({ where: { id } });
  await logger.delete(event, JSON.stringify({ modulo: "financeiro", tipo: "conta_receber", id }));
  return true;
});
