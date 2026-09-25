import prisma from "@/lib/prisma";

export const getEmpresaWhatsappIntegracao = (empresaId: number) =>
  prisma.integracao.findFirst({
    where: { empresa_id: empresaId, tipo: "whatsapp" },
  });
