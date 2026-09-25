import type { Prisma } from "@prisma/client";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import prisma from "../../../lib/prisma";

interface DashboardLeadMetricsInput {
  where: Prisma.LeadWhereInput;
  queryDate: Dayjs;
  startOfYear: Dayjs;
  endOfYear: Dayjs;
  rangeStart: Dayjs;
  rangeEnd: Dayjs;
  groupMonthsByCompany: boolean;
}

const percentageChange = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : 0;

export async function getDashboardLeadMetrics({
  where,
  queryDate,
  startOfYear,
  endOfYear,
  rangeStart,
  rangeEnd,
  groupMonthsByCompany,
}: DashboardLeadMetricsInput) {
  const yearRange = {
    gte: startOfYear.toDate(),
    lt: endOfYear.toDate(),
  };
  const [
    totalYear,
    totalYearPrevious,
    totalMonth,
    totalMonthPrevious,
    totalDay,
    totalDayPrevious,
    totalLeads,
    leadsByStateRaw,
  ] = await Promise.all([
    prisma.lead.count({ where: { ...where, criado: yearRange } }),
    prisma.lead.count({
      where: {
        ...where,
        criado: {
          gte: startOfYear.subtract(1, "year").toDate(),
          lt: endOfYear.subtract(1, "year").toDate(),
        },
      },
    }),
    prisma.lead.count({
      where: {
        ...where,
        criado: {
          gte: queryDate.startOf("month").toDate(),
          lt: queryDate.endOf("month").toDate(),
        },
      },
    }),
    prisma.lead.count({
      where: {
        ...where,
        criado: {
          gte: queryDate.subtract(1, "month").startOf("month").toDate(),
          lt: queryDate.subtract(1, "month").endOf("month").toDate(),
        },
      },
    }),
    prisma.lead.count({
      where: {
        ...where,
        criado: {
          gte: queryDate.startOf("day").toDate(),
          lt: queryDate.endOf("day").toDate(),
        },
      },
    }),
    prisma.lead.count({
      where: {
        ...where,
        criado: {
          gte: queryDate.subtract(1, "day").startOf("day").toDate(),
          lt: queryDate.subtract(1, "day").endOf("day").toDate(),
        },
      },
    }),
    prisma.lead.findMany({
      where: { ...where, criado: yearRange },
      select: {
        criado: true,
        usuario: { select: { nome: true } },
        empresa: { select: { nome: true } },
      },
    }),
    prisma.localizacao.groupBy({
      by: ["estado"],
      where: {
        estado: { not: null },
        lead: {
          ...where,
          criado: {
            gte: rangeStart.startOf("day").toDate(),
            lt: rangeEnd.endOf("day").toDate(),
          },
        },
      },
      _count: { estado: true },
      orderBy: { _count: { estado: "desc" } },
    }),
  ]);

  const months = groupMonthsByCompany
    ? totalLeads.reduce(
        (result, lead) => {
          const month = String(dayjs(lead.criado).month() + 1).padStart(2, "0");
          const company = lead.empresa.nome || "Empresa desconhecida";
          result[month] ??= {};
          result[month][company] = (result[month][company] || 0) + 1;
          return result;
        },
        {} as Record<string, Record<string, number>>,
      )
    : totalLeads.reduce(
        (result, lead) => {
          const month = String(dayjs(lead.criado).month() + 1).padStart(2, "0");
          result[month] = (result[month] || 0) + 1;
          return result;
        },
        {} as Record<string, number>,
      );

  return {
    total: {
      value: totalLeads.length,
      averagePerMonth: Math.round(totalLeads.length / 12),
      averagePerDay: Math.round(totalLeads.length / 365),
    },
    leadsByState: leadsByStateRaw.map((item) => ({
      name: item.estado || "Não informado",
      value: item._count.estado,
    })),
    year: {
      total: totalYear,
      previousTotal: totalYearPrevious,
      percentageChange: percentageChange(totalYear, totalYearPrevious),
      months,
    },
    month: {
      total: totalMonth,
      previousTotal: totalMonthPrevious,
      percentageChange: percentageChange(totalMonth, totalMonthPrevious),
    },
    day: {
      total: totalDay,
      previousTotal: totalDayPrevious,
      percentageChange: percentageChange(totalDay, totalDayPrevious),
    },
  };
}
