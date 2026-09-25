export interface OpportunityBoardCard {
  id: number;
  tipo: string;
  board_id: number | null;
  statusInt: number;
  descricao: string;
  criado: string;
  atualizado: string;
  motivo_atual?: {
    motivo: string;
    motivo_observacao: string | null;
    criado: string;
  } | null;
  responsavel_atual?: { principal?: boolean; pode_editar?: boolean } | null;
  responsaveis: Array<{
    principal?: boolean;
    usuario: { id: number; nome: string; avatar: string | null };
  }>;
  _count?: { responsaveis: number };
  lead: { nome_lead: string };
  posicao: number;
}

interface PendingBoardMove {
  item: OpportunityBoardCard;
  status: number;
  posicao: number;
  previousBoardId: number | null;
  previousPosicao: number;
}

export function useOpportunityBoard() {
  const oportunidades = useOportunidades();
  const oportunidade = useOportunidade();
  const { user } = useAuthSession();

  const loadMore = async (boardId: number) => {
    if (
      oportunidades.isLoading ||
      !oportunidades.boardHasMore?.[boardId] ||
      oportunidades.boardLoadingMore?.[boardId]
    ) {
      return;
    }
    await oportunidades.loadMore(boardId);
  };

  const getResponsaveis = (item: OpportunityBoardCard) =>
    (item.responsaveis || []).map((responsavel) => ({
      id: responsavel.usuario.id,
      nome: responsavel.usuario.nome,
      avatar: responsavel.usuario.avatar,
      principal: !!responsavel.principal,
    }));

  const getExtraCount = (item: OpportunityBoardCard, shown: number) =>
    Math.max((item._count?.responsaveis || 0) - shown, 0);

  const canMoveItem = (item: OpportunityBoardCard) => {
    const permissions = user.permissoes;
    return (
      hasUserPermission(permissions, UserPermissions.ADMIN) ||
      hasUserPermission(permissions, UserPermissions.GRANT_ADMIN) ||
      hasUserPermission(permissions, UserPermissions.EDITAR_OPORTUNIDADE) ||
      !!item.responsavel_atual?.principal ||
      !!item.responsavel_atual?.pode_editar
    );
  };

  const boardList = computed(() =>
    (oportunidades.boards?.data || [])
      .map((board) => ({
        id: board.id,
        titulo: board.titulo,
        cor: board.cor,
        posicao: board.posicao,
        qualificacao: board.qualificacao,
        controle_lembretes: board.controle_lembretes ?? true,
        exige_motivo: board.exige_motivo ?? false,
        grupo_motivos: board.grupo_motivos ?? null,
        motivos: board.motivos ?? [],
        exigir_obs_outro: board.exigir_obs_outro ?? false,
        usuario_atribuido: board.usuario_atribuido ?? null,
      }))
      .sort((first, second) => first.posicao - second.posicao),
  );

  const reasonDialogOpen = ref(false);
  const pendingMove = ref<PendingBoardMove | null>(null);

  const persistMove = async (
    item: OpportunityBoardCard,
    status: number,
    position: number,
    reason?: { motivo: string; motivo_observacao: string | null },
  ) => {
    const boardChanged = item.board_id !== status;
    const currentReason = reason
      ? { ...reason, criado: new Date().toISOString() }
      : boardChanged
        ? null
        : item.motivo_atual;
    const storedItem = oportunidades.data?.data?.find(
      (opportunity) => opportunity.id === item.id,
    );
    if (storedItem) {
      storedItem.board_id = status;
      storedItem.posicao = position;
      storedItem.atualizado = new Date().toString();
      storedItem.motivo_atual = currentReason;
    }
    item.board_id = status;
    item.posicao = position;
    item.motivo_atual = currentReason;

    const updated = await oportunidade.updateStatusById(
      item.id,
      status,
      position,
      reason,
    );
    if (updated) {
      ElMessage.success({
        message: "Card movido com sucesso!",
        grouping: true,
        plain: true,
      });
    } else {
      await oportunidades.findAll();
    }
  };

  const confirmReasonMove = async (reason: {
    motivo: string;
    motivo_observacao: string | null;
  }) => {
    const move = pendingMove.value;
    pendingMove.value = null;
    if (move) await persistMove(move.item, move.status, move.posicao, reason);
  };

  const cancelReasonMove = async () => {
    const move = pendingMove.value;
    pendingMove.value = null;
    reasonDialogOpen.value = false;
    if (!move) return;

    move.item.board_id = move.previousBoardId;
    move.item.posicao = move.previousPosicao;
    await oportunidades.findAll();
  };

  const oportunidadesByStatus = computed<
    Record<number, OpportunityBoardCard[]>
  >(() => {
    const grouped: Record<number, OpportunityBoardCard[]> = {};
    boardList.value.forEach((board) => (grouped[board.id] = []));
    if (!boardList.value.length) return grouped;

    const firstBoardId = boardList.value[0].id;
    (oportunidades.data?.data || []).forEach((item) => {
      const card = item as OpportunityBoardCard;
      const boardId =
        card.board_id && grouped[card.board_id] !== undefined
          ? card.board_id
          : firstBoardId;
      grouped[boardId].push(card);
    });
    Object.values(grouped).forEach((items) =>
      items.sort((first, second) => first.posicao - second.posicao),
    );
    return grouped;
  });

  const handleChangeStatus = async (event: any, status: number) => {
    try {
      const item = event.clonedData as OpportunityBoardCard;
      if (!status || !item) return;

      const list = oportunidadesByStatus.value[status] || [];
      const before = list[event.newIndex - 1] ?? null;
      const after = list[event.newIndex + 1] ?? null;
      let position = before
        ? after
          ? (before.posicao + after.posicao) / 2
          : before.posicao + 1024
        : after
          ? after.posicao - 1
          : 1024;
      while (list.some((card) => card.posicao === position)) position += 0.0001;

      const targetBoard = boardList.value.find((board) => board.id === status);
      if (targetBoard?.exige_motivo && item.board_id !== status) {
        pendingMove.value = {
          item,
          status,
          posicao: position,
          previousBoardId: item.board_id,
          previousPosicao: item.posicao,
        };
        reasonDialogOpen.value = true;
        return;
      }
      await persistMove(item, status, position);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    boardList,
    cancelReasonMove,
    canMoveItem,
    confirmReasonMove,
    getExtraCount,
    getResponsaveis,
    handleChangeStatus,
    loadMore,
    oportunidadesByStatus,
    pendingMove,
    persistMove,
    reasonDialogOpen,
  };
}
