import dayjs from "dayjs";
import { z } from "zod";
import { createNumberSchema } from "../../utils/schema";

export const dashboardStatsSchema = z.object({
  userId: z.union([z.string(), z.number()]).default("all"),
  boardId: createNumberSchema("Board").nullable().optional(),
  opportunityId: createNumberSchema("Oportunidade").nullable().optional(),
  year: createNumberSchema("Ano").default(dayjs().year().toString()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interactionStartDate: z.string().optional(),
  interactionEndDate: z.string().optional(),
  interactionPage: createNumberSchema("Pagina das interacoes").default("1"),
  interactionPerPage: createNumberSchema("Itens por pagina").default("25"),
});

export type DashboardStatsQuery = z.infer<typeof dashboardStatsSchema>;
