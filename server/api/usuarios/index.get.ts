import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { z } from "zod";

const usersQuerySchema = z.object({
  name: z.string().optional(),
  status: z.string().default("all"),
  page: pageSchema,
  perPage: perPageSchema,
});

// Rota para retornar todos os usuários
export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.VER_USUARIO,
      )
    )
      throw new Error("Você não tem permissão suficiente");

    const query = await getValidatedQuery(event, usersQuerySchema.parseAsync);
    const statusQuery = (query.status || "all").toLowerCase();
    const status =
      statusQuery === "inativo" || statusQuery === "true"
        ? "inativo"
        : statusQuery === "ativo" || statusQuery === "false"
          ? "ativo"
          : "all";

    const where: Prisma.UsuarioWhereInput = {};
    const andWhere: Prisma.UsuarioWhereInput[] = [];
    const select: Prisma.UsuarioSelect = {
      id: true,
      nome: true,
      desativado: true,
      avatar: true,
    };

    if (
      !hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
    )
      where.empresa_id = event.context.auth.empresa_id;
    if (
      hasUserPermission(
        event.context.auth.permissoes,
        UserPermissions.GRANT_ADMIN,
      )
    ) {
      select.empresa = {
        select: {
          desativado: true,
        },
      };
    }
    if (status === "ativo") {
      andWhere.push({
        desativado: false,
        OR: [{ empresa_id: null }, { empresa: { is: { desativado: false } } }],
      });
    }

    if (status === "inativo") {
      andWhere.push({
        OR: [{ desativado: true }, { empresa: { is: { desativado: true } } }],
      });
    }

    if (query.name) {
      andWhere.push({
        OR: [
          { contato: { contains: query.name } },
          { nome: { contains: query.name } },
        ],
      });
    }

    if (andWhere.length) where.AND = andWhere;

    const total = await prisma.usuario.count({ where });
    const totalPages = Math.ceil(total / query.perPage);
    const validPage = Math.min(Math.max(query.page, 1), totalPages || 1);

    const data = await prisma.usuario.findMany({
      where,
      skip: (validPage - 1) * query.perPage,
      take: query.perPage,
      select,
    });

    const usuarioIds = data.map((item) => item.id);
    const limiteOnline = new Date(Date.now() - 90 * 1000);
    const isGrantAdmin = hasUserPermission(
      event.context.auth.permissoes,
      UserPermissions.GRANT_ADMIN,
    );

    const sessoesOnline = usuarioIds.length
      ? await prisma.sessaoPresenca.findMany({
          where: {
            usuario_id: { in: usuarioIds },
            ...(isGrantAdmin
              ? {}
              : { empresa_id: event.context.auth.empresa_id }),
            encerrado: null,
            ultimo_heartbeat: { gte: limiteOnline },
          },
          select: {
            usuario_id: true,
          },
        })
      : [];

    const usuarioOnlineSet = new Set(sessoesOnline.map((s) => s.usuario_id));
    const dataComPresenca = data.map((item) => ({
      ...item,
      online: usuarioOnlineSet.has(item.id),
    }));

    return { data: dataComPresenca, total, page: validPage, totalPages };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Ocorreu um erro ao buscar todos os Usuários",
    });
  }
});
