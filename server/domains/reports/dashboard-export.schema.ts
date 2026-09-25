import dayjs from "dayjs";
import { z } from "zod";

export const dashboardExportSchema = z.object({
  userId: z.union([z.string(), z.number()]).default("all"),
  year: z.union([z.string(), z.number()]).default(dayjs().year().toString()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  interactionStartDate: z.string().optional(),
  interactionEndDate: z.string().optional(),
  boardIds: z.array(z.coerce.number().int().positive()).max(100).default([]),
});

export type DashboardExportQuery = z.infer<typeof dashboardExportSchema>;
