type PrismaLikeClient = {
  oportunidade: {
    findUnique: Function;
    findMany: Function;
  };
  lembrete: {
    deleteMany: Function;
  };
};

export async function canOpportunityGenerateReminders(
  client: PrismaLikeClient,
  oportunidadeId: number,
) {
  const oportunidade = await client.oportunidade.findUnique({
    where: { id: oportunidadeId },
    select: {
      controle_lembretes: true,
      board: {
        select: {
          controle_lembretes: true,
        },
      },
    },
  });

  if (!oportunidade?.controle_lembretes) return false;

  return oportunidade.board?.controle_lembretes ?? true;
}

export async function deleteOpportunityReminders(
  client: PrismaLikeClient,
  oportunidadeId: number,
) {
  return client.lembrete.deleteMany({
    where: { oportunidade_id: oportunidadeId },
  });
}

export async function deleteBoardOpportunityReminders(
  client: PrismaLikeClient,
  boardId: number,
) {
  const oportunidades = await client.oportunidade.findMany({
    where: { board_id: boardId },
    select: { id: true },
  });

  if (!oportunidades.length) return { count: 0 };

  return client.lembrete.deleteMany({
    where: {
      oportunidade_id: {
        in: oportunidades.map((item: { id: number }) => item.id),
      },
    },
  });
}

export async function syncOpportunityRemindersWithBoard(
  client: PrismaLikeClient,
  oportunidadeId: number,
) {
  const enabled = await canOpportunityGenerateReminders(client, oportunidadeId);

  if (!enabled) {
    await deleteOpportunityReminders(client, oportunidadeId);
  }

  return enabled;
}
