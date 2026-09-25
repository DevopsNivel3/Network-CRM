import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { parseDecimal } from "./dashboard-workbook.utils";

interface DatedRecord {
  criado: Date;
}

interface PipelineRecord extends DatedRecord {
  valor_estimado: unknown;
}

export function buildDashboardTimeSeries(
  rangeStart: Dayjs,
  rangeEnd: Dayjs,
  leads: DatedRecord[],
  opportunities: PipelineRecord[],
) {
  const startCursor = rangeStart.startOf("day");
  const endCursor = rangeEnd.startOf("day");
  const totalDays = endCursor.diff(startCursor, "day") + 1;
  const labelFormat =
    rangeStart.year() === rangeEnd.year() ? "DD/MM" : "DD/MM/YYYY";
  const keys = Array.from({ length: Math.max(totalDays, 0) }, (_, index) =>
    startCursor.add(index, "day").format("YYYY-MM-DD"),
  );
  const labels = keys.map((key) => dayjs(key).format(labelFormat));
  const leadCounts = new Map(keys.map((key) => [key, 0]));
  const opportunityCounts = new Map(keys.map((key) => [key, 0]));
  const pipelineValues = new Map(keys.map((key) => [key, 0]));

  leads.forEach((lead) => {
    const key = dayjs(lead.criado).format("YYYY-MM-DD");
    if (leadCounts.has(key))
      leadCounts.set(key, (leadCounts.get(key) || 0) + 1);
  });
  opportunities.forEach((opportunity) => {
    const key = dayjs(opportunity.criado).format("YYYY-MM-DD");
    if (opportunityCounts.has(key)) {
      opportunityCounts.set(key, (opportunityCounts.get(key) || 0) + 1);
    }
    if (pipelineValues.has(key)) {
      pipelineValues.set(
        key,
        (pipelineValues.get(key) || 0) +
          parseDecimal(opportunity.valor_estimado ?? 0),
      );
    }
  });

  const dayCounts = keys.map((key) => leadCounts.get(key) || 0);
  const opportunityDayCounts = keys.map(
    (key) => opportunityCounts.get(key) || 0,
  );
  const pipelineDailyValues = keys.map((key) => pipelineValues.get(key) || 0);
  const pipelineCumulativeValues = pipelineDailyValues.reduce<number[]>(
    (values, value) => {
      values.push((values.at(-1) || 0) + value);
      return values;
    },
    [],
  );
  const totalLeads = leads.length;
  const totalOpportunities = opportunities.length;

  return {
    labels,
    startCursor,
    totalDays,
    rangeStartDay: rangeStart.startOf("day"),
    rangeEndDay: rangeEnd.endOf("day"),
    leadsByDay: {
      categories: labels,
      series: [
        { name: "Leads", data: dayCounts },
        { name: "Oportunidades", data: opportunityDayCounts },
      ],
    },
    pipelineValueByDay: {
      categories: labels,
      series: [
        {
          name: "Valor estimado acumulado",
          data: pipelineCumulativeValues,
        },
      ],
    },
    pipelineValueTotal: pipelineDailyValues.reduce(
      (total, value) => total + value,
      0,
    ),
    totalLeadsInRange: totalLeads,
    totalOportunidadesInRange: totalOpportunities,
    averageLeadsPerDay: totalDays > 0 ? totalLeads / totalDays : 0,
    averageOportunidadesPerDay:
      totalDays > 0 ? totalOpportunities / totalDays : 0,
    conversionRate:
      totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0,
  };
}
