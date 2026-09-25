import prisma from "@/lib/prisma";
import { receivableBodySchema } from "@/server/utils/financeiro-schemas";
import { nullableText, parseDateOnly, requireFinancialAccess, serializeFinancialRecord } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId, userId } = requireFinancialAccess(event);
  const body = await readValidatedBody(event, receivableBodySchema.parseAsync);
  const lead = await prisma.lead.findFirst({ where: { id: body.lead_id, empresa_id: companyId }, select: { id: true } });
  if (!lead) throw createError({ statusCode: 400, message: "Cliente não encontrado nesta empresa." });
  const data = await prisma.contaReceber.create({
    data: {
      descricao: body.descricao, lead_id: body.lead_id, responsavel: nullableText(body.responsavel),
      valor: body.valor, data_vencimento: parseDateOnly(body.data_vencimento),
      forma_recebimento: body.forma_recebimento || null, banco: nullableText(body.banco),
      recorrente: body.recorrente, categoria: nullableText(body.categoria), observacoes: nullableText(body.observacoes),
      empresa_id: companyId, criado_por: userId,
    },
    include: { lead: { select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true } } },
  });
  await logger.create(event, JSON.stringify({ modulo: "financeiro", tipo: "conta_receber", id: data.id, lead_id: body.lead_id }));
  return serializeFinancialRecord(data);
});
