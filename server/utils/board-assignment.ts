import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaLikeClient = PrismaClient | Prisma.TransactionClient;

export type BoardAssignmentResult = {
  assignedUserId: number;
  createdResponsavel: boolean;
  grantedManagement: boolean;
};

export async function applyBoardAssignedUserToOpportunity(
  client: PrismaLikeClient,
  oportunidadeId: number,
  boardId: number | null | undefined,
) {
  if (!boardId) return null;

  const board = await client.boardOportunidade.findUnique({
    where: { id: boardId },
    select: {
      usuario_atribuido_id: true,
    },
  });

  if (!board?.usuario_atribuido_id) return null;

  const existingResponsavel = await client.oportunidadeResponsaveis.findFirst({
    where: {
      oportunidade_id: oportunidadeId,
      usuario_id: board.usuario_atribuido_id,
    },
    select: {
      id: true,
      principal: true,
      gerencia_responsaveis: true,
      pode_editar: true,
      pode_interacoes: true,
      pode_visitas: true,
    },
  });

  await client.oportunidadeResponsaveis.updateMany({
    where: {
      oportunidade_id: oportunidadeId,
      usuario_id: {
        not: board.usuario_atribuido_id,
      },
      principal: false,
    },
    data: {
      gerencia_responsaveis: false,
    },
  });

  if (existingResponsavel) {
    const shouldUpdatePermissions =
      !existingResponsavel.gerencia_responsaveis ||
      !existingResponsavel.pode_editar ||
      !existingResponsavel.pode_interacoes ||
      !existingResponsavel.pode_visitas;

    if (shouldUpdatePermissions) {
      await client.oportunidadeResponsaveis.update({
        where: { id: existingResponsavel.id },
        data: {
          gerencia_responsaveis: true,
          pode_editar: true,
          pode_interacoes: true,
          pode_visitas: true,
        },
      });
    }

    return {
      assignedUserId: board.usuario_atribuido_id,
      createdResponsavel: false,
      grantedManagement: shouldUpdatePermissions,
    } satisfies BoardAssignmentResult;
  }

  await client.oportunidadeResponsaveis.create({
    data: {
      oportunidade_id: oportunidadeId,
      usuario_id: board.usuario_atribuido_id,
      principal: false,
      gerencia_responsaveis: true,
      pode_editar: true,
      pode_interacoes: true,
      pode_visitas: true,
    },
  });

  return {
    assignedUserId: board.usuario_atribuido_id,
    createdResponsavel: true,
    grantedManagement: true,
  } satisfies BoardAssignmentResult;
}
