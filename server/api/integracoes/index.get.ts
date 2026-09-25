import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const empresaId = event.context.auth.empresa_id;
    const query = getQuery(event);
    const page = Number(query.page || 1);
    const perPage = Number(query.perPage || 100);
    const skip = (page - 1) * perPage;

    const [total, data] = await Promise.all([
      prisma.integracao.count({ where: { empresa_id: empresaId } }),
      prisma.integracao.findMany({
        where: { empresa_id: empresaId },
        orderBy: { atualizado: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          tipo: true,
          enabled: true,
          config: true,
          criado: true,
          atualizado: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return {
      total,
      data,
      page,
      totalPages,
    };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar integrações",
    });
  }
});
