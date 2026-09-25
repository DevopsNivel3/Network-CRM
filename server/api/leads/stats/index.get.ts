import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { z } from "zod";

const statsQuerySchema = z.object({
  userId: z.union([z.string(), z.number()]).default("all"),
  year: createNumberSchema("Ano").default(dayjs().year().toString()),
});

export default defineEventHandler(async (event) => {
  try {
    const query = await getValidatedQuery(event, statsQuerySchema.parseAsync);
    const where: Prisma.LeadWhereInput = {};

    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const isAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.ADMIN,
    );

    if (!isGrantAdmin) {
      where.empresa_id = event.context.auth.empresa_id;
    }

    if (!isAdmin && !isGrantAdmin) {
      where.usuario_id = event.context.auth.id;
    }

    if (query.userId !== "all" && !isNaN(Number(query.userId))) {
      if (isGrantAdmin || isAdmin) {
        where.usuario_id = Number(query.userId);
      }
    }

    const startOfYear = dayjs().year(query.year).startOf("year");
    const endOfYear = dayjs().year(query.year).endOf("year");

    const currentDate = dayjs();
    const currentYear = currentDate.year();
    const currentMonth = currentDate.month() + 1;
    const currentDay = currentDate.date();

    const totalYear = await prisma.lead.count({
      where: {
        ...where,
        criado: {
          gte: new Date(startOfYear.toISOString()),
          lt: new Date(endOfYear.toISOString()),
        },
      },
    });

    const totalMonth =
      query.year === currentYear
        ? await prisma.lead.count({
            where: {
              ...where,
              criado: {
                gte: new Date(currentDate.startOf("month").toISOString()),
                lt: new Date(currentDate.endOf("month").toISOString()),
              },
            },
          })
        : 0;

    const totalDay =
      query.year === currentYear
        ? await prisma.lead.count({
            where: {
              ...where,
              criado: {
                gte: new Date(currentDate.startOf("day").toISOString()),
                lt: new Date(currentDate.endOf("day").toISOString()),
              },
            },
          })
        : 0;

    const totalLeads = await prisma.lead.findMany({
      where: {
        ...where,
        criado: {
          gte: new Date(startOfYear.toISOString()),
          lt: new Date(endOfYear.toISOString()),
        },
      },
      include: {
        usuario: true,
        empresa: true,
      },
    });

    const monthsData =
      query.userId === "all" && (isGrantAdmin || isAdmin)
        ? totalLeads.reduce(
            (acc, lead) => {
              const date = dayjs(lead.criado);
              const month = date.month() + 1;
              const monthStr = month.toString().padStart(2, "0");

              const key = isGrantAdmin
                ? lead.empresa.nome || "Empresa desconhecida"
                : lead.usuario?.nome || "Usuário desconhecido";

              if (!acc[monthStr]) acc[monthStr] = {};
              if (!acc[monthStr][key]) acc[monthStr][key] = 0;
              acc[monthStr][key]++;
              return acc;
            },
            {} as Record<string, Record<string, number>>,
          )
        : totalLeads.reduce(
            (acc, lead) => {
              const date = dayjs(lead.criado);
              const month = date.month() + 1;
              const monthStr = month.toString().padStart(2, "0");
              if (!acc[monthStr]) acc[monthStr] = 0;
              acc[monthStr]++;
              return acc;
            },
            {} as Record<string, number>,
          );

    return {
      total: totalLeads.length,
      year: {
        number: query.year.toString(),
        total: totalYear,
        months: monthsData,
      },
      month: {
        number: currentMonth.toString().padStart(2, "0"),
        total: totalMonth,
      },
      day: {
        number: currentDay.toString().padStart(2, "0"),
        total: totalDay,
      },
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar o gráfico",
    });
  }
});
