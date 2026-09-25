import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Rota para retornar um usuário pelo ID
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_USUARIO,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const { id } = await getValidatedRouterParams(
      event,
      idParamSchema.parseAsync,
    );
    const where: Prisma.UsuarioWhereUniqueInput = { id };

    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
    )
      where.empresa_id = event.context.auth.empresa_id;

    const select: Prisma.UsuarioSelect = {
      id: true,
      nome: true,
      cpf: true,
      contato: true,
      desativado: true,
      permissoes: true,
      email: true,
      criado: true,
      avatar: true,
      atualizado: true,
      _count: {
        select: {
          leads: true,
          oportunidades: true,
          visitas: true,
        },
      },
    };

    if (
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
    ) {
      select.empresa = {
        select: {
          id: true,
          nome: true,
          desativado: true,
          modulos: true,
        },
      };
    }

    const data = await prisma.usuario.findUnique({
      where,
      select,
    });

    if (!data) throw new Error("Usuário não encontrado");

    const limiteOnline = new Date(Date.now() - 90 * 1000);
    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );
    const sessaoOnline = await prisma.sessaoPresenca.findFirst({
      where: {
        usuario_id: data.id,
        ...(isGrantAdmin
          ? {}
          : { empresa_id: event.context.auth.empresa_id }),
        encerrado: null,
        ultimo_heartbeat: { gte: limiteOnline },
      },
      select: { id: true },
    });

    const payload = {
      ...data,
      online: !!sessaoOnline,
    };

    await logger.view(event, JSON.stringify(payload));

    return payload;
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar o Usuário",
    });
  }
});
