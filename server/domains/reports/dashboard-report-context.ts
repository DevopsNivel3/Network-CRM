import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import type { DashboardExportQuery } from "./dashboard-export.schema";
import { isValidDate } from "./dashboard-workbook.utils";

interface DashboardReportAuth {
  id: number;
  permissoes: number;
  empresa_id: number | null;
}

export function createDashboardReportContext(
  query: DashboardExportQuery,
  auth: DashboardReportAuth,
) {
  const isGrantAdmin = hasUserPermission(
    auth.permissoes,
    UserPermissions.GRANT_ADMIN,
  );
  const isAdmin = hasUserPermission(auth.permissoes, UserPermissions.ADMIN);
  if (!isGrantAdmin && auth.empresa_id === null) {
    throw new Error("Usuário sem empresa vinculada");
  }
  const selectedUserId =
    query.userId !== "all" && !Number.isNaN(Number(query.userId))
      ? Number(query.userId)
      : null;
  const selectedBoardIds = [...new Set(query.boardIds)];
  const hasValidInteractionStart = isValidDate(query.interactionStartDate);
  const hasValidInteractionEnd = isValidDate(query.interactionEndDate);
  const interactionDateFilter = {
    ...(hasValidInteractionStart && {
      gte: new Date(
        new Date(query.interactionStartDate!).setUTCHours(3, 0, 0, 0),
      ),
    }),
    ...(hasValidInteractionEnd && {
      lte: new Date(
        new Date(query.interactionEndDate!).setUTCHours(26, 59, 59, 999),
      ),
    }),
  };

  const leadWhere: Prisma.LeadWhereInput = {};
  if (!isGrantAdmin) leadWhere.empresa_id = auth.empresa_id!;
  if (!isAdmin && !isGrantAdmin) leadWhere.usuario_id = auth.id;
  if (selectedUserId && (isAdmin || isGrantAdmin)) {
    leadWhere.usuario_id = selectedUserId;
  }
  if (hasValidInteractionStart || hasValidInteractionEnd) {
    leadWhere.oportunidades = {
      some: { interacoes: { some: { data: interactionDateFilter } } },
    };
  }
  if (selectedBoardIds.length) {
    const boardFilter: Prisma.LeadWhereInput = {
      oportunidades: { some: { board_id: { in: selectedBoardIds } } },
    };
    if (leadWhere.oportunidades) {
      const interactionFilter: Prisma.LeadWhereInput = {
        oportunidades: leadWhere.oportunidades,
      };
      delete leadWhere.oportunidades;
      leadWhere.AND = [interactionFilter, boardFilter];
    } else {
      leadWhere.oportunidades = boardFilter.oportunidades;
    }
  }

  const oportunidadesWhere: Prisma.OportunidadeWhereInput = {};
  if (!isGrantAdmin) oportunidadesWhere.lead = { empresa_id: auth.empresa_id! };
  if (!isAdmin && !isGrantAdmin) oportunidadesWhere.usuario_id = auth.id;
  if (selectedUserId && (isAdmin || isGrantAdmin)) {
    oportunidadesWhere.usuario_id = selectedUserId;
  }
  if (selectedBoardIds.length) {
    oportunidadesWhere.board_id = { in: selectedBoardIds };
  }
  if (hasValidInteractionStart || hasValidInteractionEnd) {
    oportunidadesWhere.interacoes = { some: { data: interactionDateFilter } };
  }

  const queryYear = Number(query.year || dayjs().year());
  const queryDate = dayjs().year(queryYear);
  const rangeStart = isValidDate(query.startDate)
    ? dayjs(query.startDate)
    : queryDate.startOf("month");
  const rangeEnd = isValidDate(query.endDate)
    ? dayjs(query.endDate)
    : queryDate.endOf("month");
  const rangeStartDay = rangeStart.startOf("day");
  const rangeEndDay = rangeEnd.endOf("day");

  return {
    isGrantAdmin,
    isAdmin,
    selectedUserId,
    selectedBoardIds,
    hasValidInteractionStart,
    hasValidInteractionEnd,
    leadWhere,
    oportunidadesWhere,
    queryYear,
    rangeStart,
    rangeEnd,
    rangeStartDay,
    rangeEndDay,
    totalDays: rangeEndDay.diff(rangeStartDay, "day") + 1,
  };
}
