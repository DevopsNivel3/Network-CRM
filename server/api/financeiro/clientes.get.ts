import prisma from "@/lib/prisma";
import { requireFinancialAccess } from "@/server/utils/financeiro";

export default defineEventHandler(async (event) => {
  const { companyId } = requireFinancialAccess(event);
  const data = await prisma.lead.findMany({
    where: { empresa_id: companyId },
    orderBy: { nome_lead: "asc" },
    select: { id: true, nome_lead: true, cpf_cnpj: true, contato: true, contato_nome: true },
  });
  return { data };
});
