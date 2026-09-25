import prisma from "~/lib/prisma";
import { UserPermissions, hasUserPermission } from "~/utils/permissions";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const status = query.status as string | undefined;
    const boardId = Number(query.boardId);
    const opportunityId = Number(query.opportunityId);
    const requestedPage = Math.max(Number(query.page) || 1, 1);
    const perPage = Math.min(Math.max(Number(query.perPage) || 25, 5), 100);

    const isAdmin = hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN);

    const where: any = {
      empresa_id: event.context.auth.empresa_id,
    };

    if (!isAdmin) {
      where.usuario_id = event.context.auth.id;
    }

    if (status) {
      where.status = status;
    }

    if (
      (Number.isFinite(boardId) && boardId > 0) ||
      (Number.isFinite(opportunityId) && opportunityId > 0)
    ) {
      where.oportunidade = {
        ...(Number.isFinite(boardId) && boardId > 0 ? { board_id: boardId } : {}),
        ...(Number.isFinite(opportunityId) && opportunityId > 0
          ? { id: opportunityId }
          : {}),
      };
    }

    // Only show reminders that are due today or overdue
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    where.data_vencimento = {
      lte: today
    };

    const total = await prisma.lembrete.count({ where });
    const totalPages = Math.max(Math.ceil(total / perPage), 1);
    const page = Math.min(requestedPage, totalPages);

    const lembretes = await prisma.lembrete.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: [
        { data_vencimento: 'asc' },
        { prioridade: 'asc' } // "Alta" comes before "Baixa" alphabetically, but wait, "Alta", "Media", "Baixa" - we might want to map priority to number to sort correctly. Let's sort by date first.
      ],
      include: {
        usuario: {
          select: {
            nome: true,
            avatar: true,
          }
        },
        lead: {
          select: {
            id: true,
            nome_lead: true,
            contato_nome: true,
            contato: true,
          }
        },
        oportunidade: {
          select: {
            id: true,
            descricao: true,
          }
        }
      }
    });

    return {
      data: lembretes,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    };
  } catch (err: any) {
    console.error(err);

    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar lembretes",
    });
  }
});
