import { Prisma } from "@prisma/client";
import {
  createLeadBodySchema,
  normalizeCpfCnpj,
} from "@/server/domains/leads/create-lead.schema";
import { registerDuplicateLeadAttempt } from "@/server/domains/leads/lead-duplicate.service";
import { createLead } from "@/server/domains/leads/create-lead.service";

// Rota para criar um novo Lead
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.CRIAR_LEAD,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const body = await readValidatedBody(
      event,
      createLeadBodySchema.parseAsync,
    );
    const cpfCnpj = normalizeCpfCnpj(body.cpf_cnpj);

    if (cpfCnpj) {
      const duplicate = await registerDuplicateLeadAttempt({
        cpfCnpj,
        companyId: event.context.auth.empresa_id,
        userId: event.context.auth.id,
        userName: event.context.auth.nome,
        lead: body,
      });
      if (duplicate) {
        await logger.update(
          event,
          JSON.stringify({
            action: "LEAD_DUPLICATE_BLOCKED",
            lead_id: duplicate.lead.id,
            cpf_cnpj: cpfCnpj,
            attempted_name: body.nome_lead,
            attempted_responsavel: body.responsavel,
          }),
        );
        throw createError({
          statusCode: 409,
          statusMessage: "Lead duplicado",
          message: duplicate.message,
          data: {
            code: "LEAD_CNPJ_DUPLICATE",
            title: "CNPJ já cadastrado",
            message: duplicate.message,
            recommendation:
              "Use o lead existente para centralizar comentários, oportunidades e histórico da empresa.",
            lead: duplicate.lead,
            owner: duplicate.owner,
          },
        });
      }
    }
    const transactionResult = await createLead(
      { ...body, cpf_cnpj: cpfCnpj },
      {
        userId: event.context.auth.id,
        companyId: event.context.auth.empresa_id,
      },
    );
    await logger.create(
      event,
      JSON.stringify({
        lead: transactionResult.lead,
        oportunidadeId: transactionResult.oportunidadeId,
      }),
    );

    return transactionResult.lead;
  } catch (err: any) {
    console.error(err);

    if (err?.data?.code === "LEAD_CNPJ_DUPLICATE") throw err;

    const message =
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
        ? "Já existe um lead cadastrado com este CPF/CNPJ."
        : err?.message || "Ocorreu um erro ao criar o Lead";

    throw createError({
      statusCode: 400,
      message,
    });
  }
});
