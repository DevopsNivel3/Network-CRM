import { leadDataExportSchema } from "@/server/domains/reports/lead-data-export.schema";
import { generateLeadDataExport } from "@/server/domains/reports/lead-data-export.service";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    ) {
      throw new Error("Você não tem permissão suficiente");
    }
    const query = await readValidatedBody(
      event,
      leadDataExportSchema.parseAsync,
    );
    const result = await generateLeadDataExport(query, event.context.auth);
    if (result.contentType)
      setHeader(event, "Content-Type", result.contentType);
    if (result.filename) {
      setHeader(
        event,
        "Content-Disposition",
        `attachment; filename="${result.filename}"`,
      );
    }
    return result.body;
  } catch (error: any) {
    console.error(error);
    throw createError({
      statusCode: 400,
      message: error?.message || "Ocorreu um erro ao exportar os dados",
    });
  }
});
