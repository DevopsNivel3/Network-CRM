import prisma from "@/lib/prisma";
import { receivableBodySchema } from "@/server/utils/financeiro-schemas";
import { nullableText, parseDateOnly, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const { id } = await getValidatedRouterParams(event, idParamSchema.parseAsync);
  const body = await readValidatedBody(event, receivableBodySchema.parseAsync);
  const [existing, lead] = await Promise.all([
    prisma.contaReceber.findFirst({ where: { id, empresa_id: companyId } }),
    prisma.lead.findFirst({ where: { id: body.lead_id, empresa_id: companyId }, select: { id: true } }),
  ]);
  if (!existing) throw createError({ statusCode: 404, message: "Conta a receber não encontrada." });
  if (existing.status !== "pendente") throw createError({ statusCode: 409, message: "Somente contas pendentes podem ser editadas." });
  if (!lead) throw createError({ statusCode: 400, message: "Cliente não encontrado nesta empresa." });
  const data = await prisma.contaReceber.update({
    where: { id },
    data: {
      descricao: body.descricao, lead_id: body.lead_id, responsavel: nullableText(body.responsavel),
      valor: body.valor, data_vencimento: parseDateOnly(body.data_vencimento),
      forma_recebimento: body.forma_recebimento || null, banco: nullableText(body.banco),
      recorrente: body.recorrente, categoria: nullableText(body.categoria), observacoes: nullableText(body.observacoes),
    },
    include: { lead: { select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true } } },
  });
  await logger.update(event, JSON.stringify({ modulo: "financeiro", tipo: "conta_receber", id }));
  return serializeFinancialRecord(data);
});
