import prisma from "@/lib/prisma";
import { requireFinancialAccess } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event, true);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const existing = await prisma.contaPagar.findFirst({ where: { id, empresa_id: companyId } });
  if (!existing) throw createError({ statusCode: 404, message: "Conta a pagar não encontrada." });
  if (existing.status === "pago") throw createError({ statusCode: 409, message: "Contas pagas não podem ser excluídas; cancele somente lançamentos pendentes." });
  await prisma.contaPagar.delete({ where: { id } });
  await logger.delete(event, JSON.stringify({ modulo: "financeiro", tipo: "conta_pagar", id }));
  return true;
});
