import prisma from "@/lib/prisma";
import { z } from "zod";

const cnpjParamSchema = z.object({
  cnpj: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 14, "Informe um CNPJ com 14 dígitos"),
});

export default defineEventHandler(async (event) => {
  try {
    const { cnpj } = await getValidatedRouterParams(
      event,
      cnpjParamSchema.parseAsync,
    );

    // Primeiro, verifica se o CNPJ já está cadastrado no banco de dados para esta empresa
    const existingLead = await prisma.lead.findFirst({
      where: {
        cpf_cnpj: cnpj,
        empresa_id: event.context.auth?.empresa_id,
      },
      select: {
        id: true,
        nome_lead: true,
      }
    });

    if (existingLead) {
      throw createError({
        statusCode: 409,
        statusMessage: "Lead duplicado",
        message: `Este CNPJ já está cadastrado na base de dados (${existingLead.nome_lead || 'Lead sem nome'}).`,
        data: {
          code: "LEAD_CNPJ_DUPLICATE",
          lead_id: existingLead.id,
          nome_lead: existingLead.nome_lead,
        }
      });
    }

    const brasilApiUrl: string = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;

    const response = await fetch(brasilApiUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: "application/json",
        "User-Agent": "N3TWORK-APP/1.0 (+http://localhost)",
      },
    });

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message:
          response.status === 404
            ? "CNPJ não encontrado na BrasilAPI."
            : "Não foi possível consultar o CNPJ.",
      });
    }

    return await response.json();
  } catch (err: any) {
    console.error(err);

    if (err?.data?.code === "LEAD_CNPJ_DUPLICATE") {
      throw err;
    }

    const statusCode = err?.statusCode || err?.response?.status || 400;
    const message =
      statusCode === 404
        ? "CNPJ não encontrado na BrasilAPI."
        : statusCode === 403
          ? "A BrasilAPI recusou a consulta deste CNPJ no momento. Tente novamente em alguns instantes."
          : err?.message || "Não foi possível consultar o CNPJ.";

    throw createError({
      statusCode: statusCode === 403 ? 502 : statusCode,
      message,
    });
  }
});
