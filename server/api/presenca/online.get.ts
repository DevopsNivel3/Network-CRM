import prisma from "@/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const auth = event.context.auth;
    const isAdmin = hasUserPermission(auth.permissoes, UserPermissions.ADMIN);
    const isGrantAdmin = hasUserPermission(
      auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );

    if (!isAdmin && !isGrantAdmin)
      throw new Error("Você não tem permissão suficiente");

    const limiteOnline = new Date(Date.now() - 90 * 1000);
    const whereBase = {
      encerrado: null as Date | null,
      ultimo_heartbeat: { gte: limiteOnline },
    };

    const where = isGrantAdmin
      ? whereBase
      : { ...whereBase, empresa_id: auth.empresa_id };

    const sessoes = await prisma.sessaoPresenca.findMany({
      where,
      select: {
        usuario_id: true,
      },
      distinct: ["usuario_id"],
    });

    const usuarioIds = sessoes.map((s) => s.usuario_id);
    if (!usuarioIds.length) return { total: 0, data: [] };

    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: usuarioIds } },
      select: {
        id: true,
        nome: true,
        email: true,
        avatar: true,
      },
      orderBy: { nome: "asc" },
    });

    const sessoesPorUsuario = await prisma.sessaoPresenca.groupBy({
      by: ["usuario_id"],
      where,
      _count: { usuario_id: true },
    });
    const contador = new Map(
      sessoesPorUsuario.map((item) => [item.usuario_id, item._count.usuario_id]),
    );

    return {
      total: usuarios.length,
      data: usuarios.map((usuario) => ({
        ...usuario,
        sessoesAtivas: contador.get(usuario.id) || 0,
      })),
    };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar usuários online",
    });
  }
});
