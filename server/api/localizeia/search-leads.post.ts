import { z } from "zod";
import { scrapeGoogleMapsLeads } from "~/server/utils/localizeiaScraper";
import { UserPermissions, hasUserPermission } from "~/server/utils/permissions";

const searchLeadsBodySchema = z.object({
  niche: z.string().trim().min(2, "Informe um nicho"),
  city: z.string().trim().min(2, "Informe uma cidade"),
  uf: z.string().trim().length(2, "Informe a UF"),
});

export default defineEventHandler(async (event) => {
  if (
    !hasUserPermission(
      event.context.auth?.permissoes ?? 0,
      UserPermissions.VER_LOCALIZEIA,
    )
  ) {
    throw createError({
      statusCode: 403,
      message: "Sem permissao para usar o LocalizeIA.",
    });
  }

  const body = await readValidatedBody(event, searchLeadsBodySchema.parseAsync);

  try {
    const leads = await scrapeGoogleMapsLeads(body);
    return {
      warning: leads.length ? null : "Nenhum resultado encontrado para essa busca.",
      leads,
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 500,
      message: err?.message || "Erro ao buscar empresas no LocalizeIA.",
    });
  }
});
