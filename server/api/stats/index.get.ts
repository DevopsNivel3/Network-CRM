import { dashboardStatsSchema } from "@/server/domains/reports/dashboard-stats.schema";
import { getDashboardStats } from "@/server/domains/reports/dashboard-stats.service";

export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(
      event,
      dashboardStatsSchema.parseAsync,
    );
    return await getDashboardStats(query, event.context.auth);
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error?.message || "Ocorreu um erro ao buscar o gráfico",
    });
  }
});
