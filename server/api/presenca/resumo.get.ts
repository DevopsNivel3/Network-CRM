import prisma from "@/lib/prisma";

import { Prisma } from "@prisma/client";

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth;
    const isGrantAdmin = hasUserPermission(
      auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );

    const limiteOnline = new Date(Date.now() - 90 * 1000);
    const whereBase = {
      encerrado: null as Date | null,
      ultimo_heartbeat: { gte: limiteOnline },
    };

    const where = isGrantAdmin
      ? whereBase
      : { ...whereBase, empresa_id: auth.empresa_id };

    const sessions = await prisma.sessaoPresenca.findMany({
      where,
      select: { usuario_id: true },
      distinct: [Prisma.SessaoPresencaScalarFieldEnum.usuario_id],
    });
    const totalOnline = sessions.length;

    return { totalOnline };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar resumo de presença",
    });
  }
});
