import { generateDashboardExport } from "@/server/domains/reports/dashboard-export.service";
import { dashboardExportSchema } from "@/server/domains/reports/dashboard-export.schema";

export default defineEventHandler(async (event) => {
  try {
    const query = await readValidatedBody(
      event,
      dashboardExportSchema.parseAsync,
    );
    const { buffer, filename } = await generateDashboardExport(
      query,
      event.context.auth,
    );

    setHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );

    return buffer;
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error?.message || "Ocorreu um erro ao exportar o dashboard",
    });
  }
});
