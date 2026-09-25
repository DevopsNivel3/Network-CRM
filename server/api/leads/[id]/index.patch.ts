import { Prisma } from "@prisma/client";
import { normalizeCpfCnpj } from "@/server/domains/leads/create-lead.schema";
import { updateLeadBodySchema } from "@/server/domains/leads/update-lead.schema";
import {
  LeadNotFoundError,
  updateLead,
} from "@/server/domains/leads/update-lead.service";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.EDITAR_LEAD,
      )
    ) {
      throw new Error("Você não tem permissão suficiente");
    }

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const body = await readValidatedBody(
      event,
      updateLeadBodySchema.parseAsync,
    );
    const result = await updateLead(
      id,
      { ...body, cpf_cnpj: normalizeCpfCnpj(body.cpf_cnpj) },
      {
        userId: event.context.auth.id,
        userName: event.context.auth.nome,
        companyId: event.context.auth.empresa_id,
        isAdmin: hasUserPermission(
          event.context.auth.permissoes,
          UserPermissions.ADMIN,
        ),
        isGrantAdmin: hasUserPermission(
          event.context.auth.permissoes,
          UserPermissions.GRANT_ADMIN,
        ),
      },
    );

    if (result.kind === "duplicate") {
      await logger.update(
        event,
        JSON.stringify({
          action: "LEAD_DUPLICATE_UPDATE_BLOCKED",
          lead_id: result.duplicate.lead.id,
          attempted_lead_id: id,
          cpf_cnpj: body.cpf_cnpj,
          attempted_name: body.nome_lead,
        }),
      );
      throw createError({
        statusCode: 409,
        statusMessage: "Lead duplicado",
        message: result.duplicate.message,
        data: {
          code: "LEAD_CNPJ_DUPLICATE",
          title: "CNPJ já cadastrado",
          message: result.duplicate.message,
          recommendation:
            "Use o lead existente para centralizar comentários, oportunidades e histórico da empresa.",
          lead: result.duplicate.lead,
          owner: result.duplicate.owner,
        },
      });
    }

    await logger.update(event, JSON.stringify(result.lead));
    return result.lead;
  } catch (error: any) {
    console.error(error);
    if (error?.data?.code === "LEAD_CNPJ_DUPLICATE") throw error;
    if (error instanceof LeadNotFoundError) {
      throw createError({ statusCode: 404, message: error.message });
    }
    const message =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
        ? "Já existe um lead cadastrado com este CPF/CNPJ."
        : error?.message || "Ocorreu um erro ao atualizar o lead";
    throw createError({ statusCode: 400, message });
  }
});
