import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.LEAD_VIEW))
      throw new Error("Você não tem permissão suficiente");

    const where: Prisma.LocalizacaoWhereInput = { lead: {} };

    if (hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)) {
      if (!hasUserPermission(event.context.auth.permissoes, UserPermissions.GRANT_ADMIN))
        where.lead!.empresa_id = event.context.auth.empresa_id;
    } else {
      where.lead!.usuario_id = event.context.auth.id;
      where.lead!.empresa_id = event.context.auth.empresa_id;
    }

    const data = await prisma.localizacao.findMany({
      where,
      distinct: ["cidade"],
      select: {
        cidade: true,
      },
    });

    const formattedCidades = data.map((c, index) => ({
      value: c.cidade,
      label: c.cidade,
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
