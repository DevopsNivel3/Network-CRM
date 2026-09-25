import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import type { DashboardStatsQuery } from "./dashboard-stats.schema";
import type { ReportAuth } from "./report.types";

const isValidDate = (date?: string) =>
  !!date && !Number.isNaN(new Date(date).getTime());

export function createDashboardStatsContext(
  query: DashboardStatsQuery,
  auth: ReportAuth,
) {
  const isGrantAdmin = hasUserPermission(
    auth.permissoes,
    UserPermissions.GRANT_ADMIN,
  );
  const isAdmin = hasUserPermission(auth.permissoes, UserPermissions.ADMIN);
  if (!isGrantAdmin && auth.empresa_id === null) {
    throw new Error("Usuário sem empresa vinculada");
  }

  const where: Prisma.LeadWhereInput = {};
  if (!isGrantAdmin) where.empresa_id = auth.empresa_id!;
  if (!isAdmin && !isGrantAdmin) where.usuario_id = auth.id;
  if (
    query.userId !== "all" &&
    !Number.isNaN(Number(query.userId)) &&
    (isGrantAdmin || isAdmin)
  ) {
    where.usuario_id = Number(query.userId);
  }

  const hasValidInteractionStart = isValidDate(query.interactionStartDate);
  const hasValidInteractionEnd = isValidDate(query.interactionEndDate);
  const opportunityFilters: Prisma.OportunidadeWhereInput[] = [];
  if (query.boardId) opportunityFilters.push({ board_id: query.boardId });
  if (query.opportunityId) opportunityFilters.push({ id: query.opportunityId });
  if (hasValidInteractionStart || hasValidInteractionEnd) {
    opportunityFilters.push({
      interacoes: {
        some: {
          data: {
            ...(hasValidInteractionStart && {
              gte: new Date(
                new Date(query.interactionStartDate!).setUTCHours(3, 0, 0, 0),
              ),
            }),
            ...(hasValidInteractionEnd && {
              lte: new Date(
                new Date(query.interactionEndDate!).setUTCHours(
                  26,
                  59,
                  59,
                  999,
                ),
              ),
            }),
          },
        },
      },
    });
  }
  if (opportunityFilters.length) {
    where.oportunidades = { some: { AND: opportunityFilters } };
  }

  const queryDate = dayjs().year(query.year);
  return {
    where,
    queryDate,
    dashboardOpportunityFilters: opportunityFilters,
    isGrantAdmin,
    isAdmin,
    hasValidInteractionStart,
    hasValidInteractionEnd,
    startOfYear: queryDate.startOf("year"),
    endOfYear: queryDate.endOf("year"),
    rangeStart: isValidDate(query.startDate)
      ? dayjs(query.startDate)
      : queryDate.startOf("month"),
    rangeEnd: isValidDate(query.endDate)
      ? dayjs(query.endDate)
      : queryDate.endOf("month"),
  };
}
