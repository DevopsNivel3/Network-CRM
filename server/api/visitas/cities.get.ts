import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.OPPORTUNITY_VIEW))
      throw new Error("Você não tem permissão suficiente");

    const where: Prisma.VisitaWhereInput = { oportunidade: { lead: {} } };

    if (hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)) {
      if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN))
        where.oportunidade!.lead!.empresa_id = event.context.auth.empresa_id;
    } else {
      where.oportunidade!.lead!.usuario_id = event.context.auth.id;
      where.oportunidade!.lead!.empresa_id = event.context.auth.empresa_id;
    }

    const cities = await prisma.visita.findMany({
      where,
      select: {
        localizacao: {
          select: {
            cidade: true,
          },
        },
      },
      distinct: ["localizacao_id"],
    });

    const formattedCidades = Array.from(
      new Set(cities.map((visita) => visita.localizacao?.cidade))
    ).map((cidade, index) => ({
      value: cidade,
      label: cidade,
      id: index + 1,
    }));

    return { data: formattedCidades };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar as Cidades",
    });
  }
});
