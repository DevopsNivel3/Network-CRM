import prisma from "@/lib/prisma";
import { requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: "Cliente inválido." });
  const client = await prisma.lead.findFirst({
    where: { id, empresa_id: companyId },
    select: { contas_receber: { where: { empresa_id: companyId, status: { not: "cancelado" } }, orderBy: [{ data_vencimento: "desc" }, { id: "desc" }], include: { criador: { select: { id: true, nome: true } } } } },
  });
  if (!client) throw createError({ statusCode: 404, message: "Cliente não encontrado." });
  return { contas: client.contas_receber.map(serializeFinancialRecord) };
});
