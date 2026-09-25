import { z } from "zod";
import {
  scrapeGoogleMapsLeads,
  type LocalizeIaLead,
} from "~/server/utils/localizeiaScraper";
import { UserPermissions, hasUserPermission } from "~/server/utils/permissions";

const searchLeadsQuerySchema = z.object({
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

  const query = await getValidatedQuery(event, searchLeadsQuerySchema.parseAsync);
  const response = event.node.res;
  let closed = false;

  event.node.req.on("aborted", () => {
    closed = true;
  });
  response.on("close", () => {
    closed = true;
  });

  setResponseHeaders(event, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  response.flushHeaders?.();

  const writeMessage = (message: Record<string, unknown>) => {
    if (closed || response.writableEnded) return;
    response.write(`${JSON.stringify(message)}\n`);
  };

  try {
    const leads = await scrapeGoogleMapsLeads(query, {
      onLead: (lead: LocalizeIaLead) => {
        writeMessage({ type: "lead", lead });
      },
    });

    writeMessage({
      type: "done",
      total: leads.length,
      warning: leads.length
        ? null
        : "Nenhum resultado encontrado para essa busca.",
    });
  } catch (err: any) {
    console.error(err);
    writeMessage({
      type: "error",
      message: err?.message || "Erro ao buscar empresas no LocalizeIA.",
    });
  } finally {
    if (!response.writableEnded) response.end();
  }
});
