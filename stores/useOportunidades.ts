import type {
  BoardCardsResponse,
  BoardOpportunity as OportunidadeData,
  OpportunitiesResponse as OportunidadeResponse,
  OpportunitiesState as OportunidadeState,
  OpportunityBoard as Board,
  OpportunityListOption as OportunidadesList,
  OpportunityStatusOption as StatusOption,
  RealtimeOpportunity as OportunidadeRealtimeResponse,
} from "@/types/oportunidades";

// Store para salvar os dados de todas as Oportunidades
export const useOportunidades = defineStore("oportunidades", {
  state: (): OportunidadeState => ({
    data: {
      total: 0,
      data: [],
      page: 0,
      totalPages: 0,
    },
    boards: {
      data: [],
      isLoading: false,
    },
    boardTotals: {},
    boardPages: {},
    boardHasMore: {},
    boardLoadingMore: {},
    page: 1,
    perPage: 25,
    isSubmitting: false,
    isLoading: false,
    isLoadingMore: false,
    hasMoreBoards: true,
    filterByUserId: "all",
    filterByStatus: "all",
    filterByName: null,
    filterByCity: "all",
    filterByRange: "all",
    filterByBetweenDates: null,
    filterByInteractionDates: null,
    filterByGroupIds: [],
    filterByDisabledMode: "without",
  }),
  getters: {
    hasMore(state): boolean {
      return state.hasMoreBoards && !state.isLoadingMore;
    },
    hasMoreByBoard: (state) => {
      return (boardId: number) => !!state.boardHasMore?.[boardId];
    },
    getStatusOptions(): StatusOption[] {
      return this.boards
        .data!.sort((a, b) => a.posicao - b.posicao)
        .map((board) => ({
          value: board.id,
          label: board.titulo,
        }));
    },
    getOportunidadesStatus(): Record<number, string> {
      const boardMap: Record<number, string> = {};

      if (this.boards.data) {
        this.boards.data.forEach((board) => {
          boardMap[board.id] = board.titulo;
        });
      }

      return boardMap;
    },
    formattedOptions(state): OportunidadesList[] {
      return state.data.data
        ? state.data.data.map((item) => ({
            value: item.id,
            label: item.lead.nome_lead,
            tipo: item.tipo,
          }))
        : [];
    },
    firstBoardId(): number | null {
      const orderedBoards = [...(this.boards.data || [])].sort(
        (a, b) => a.posicao - b.posicao,
      );

      return orderedBoards[0]?.id ?? null;
    },
    hasActiveRealtimeFilters(): boolean {
      return !!(
        this.filterByUserId !== "all" ||
        this.filterByName ||
        this.filterByCity !== "all" ||
        this.filterByRange !== "all" ||
        this.filterByStatus !== "all" ||
        this.filterByGroupIds.length ||
        this.filterByBetweenDates?.length ||
        this.filterByInteractionDates?.length ||
        this.filterByDisabledMode !== "without"
      );
    },
  },
  actions: {
    resolveBoardBucketId(boardId: number | null | undefined) {
      return boardId ?? this.firstBoardId ?? null;
    },
    sortOportunidadesData(items: OportunidadeData[]) {
      const boardOrder = new Map(
        [...(this.boards.data || [])]
          .sort((a, b) => a.posicao - b.posicao)
          .map((board, index) => [board.id, index]),
      );

      return [...items].sort((a, b) => {
        const boardA = this.resolveBoardBucketId(a.board_id);
        const boardB = this.resolveBoardBucketId(b.board_id);
        const boardPosA = boardA ? (boardOrder.get(boardA) ?? 9999) : 9999;
        const boardPosB = boardB ? (boardOrder.get(boardB) ?? 9999) : 9999;

        if (boardPosA !== boardPosB) return boardPosA - boardPosB;
        if (a.posicao !== b.posicao) return a.posicao - b.posicao;
        return a.id - b.id;
      });
    },
    updateBoardTotal(boardId: number | null | undefined, delta: number) {
      const resolvedBoardId = this.resolveBoardBucketId(boardId);
      if (!resolvedBoardId) return;

      const currentTotal = this.boardTotals[resolvedBoardId] ?? 0;
      this.boardTotals = {
        ...this.boardTotals,
        [resolvedBoardId]: Math.max(0, currentTotal + delta),
      };
    },
    addBoardToState(board: Board) {
      if (!board || !this.boards.data) return;
      this.boards.data.push(board);
    },
    updateBoardFromState(id: number, data: Partial<Board>) {
      if (!id || !data || !this.boards.data) return;
      this.boards.data = this.boards.data.map((item) =>
        item.id === id ? { ...item, ...data } : item,
      );
    },
    removeBoardFromState(id: number) {
      if (!id || !this.boards.data) return;
      this.boards.data = this.boards.data.filter((item) => item.id !== id);
    },
    getBoardFromState(id: number | null | undefined): Board | undefined {
      if (!id || !this.boards.data) return;
      const board = this.boards.data?.find((item) => item.id === id);
      return board;
    },
    getOportunidadeFromState(
      id: number | null | undefined,
    ): OportunidadeData | undefined {
      if (!id || !this.data.data) return;

      const oportunidade = this.data.data?.find((item) => item.id === id);
      return oportunidade;
    },
    updateOportunidadeFromState(id: number, data: Partial<OportunidadeData>) {
      if (!id || !data || !this.data.data) return;

      this.$patch({
        data: {
          data: this.data.data.map((item) =>
            item.id === id ? { ...item, ...data } : item,
          ),
        },
      });
    },
    removeOportunidadeFromState(id: number) {
      if (!id || !this.data.data) return;

      this.$patch({
        data: {
          ...this.data,
          data: this.data.data.filter((item) => item.id !== id),
        },
      });
    },
    upsertOportunidadeFromState(
      oportunidade: OportunidadeData,
      previousBoardId?: number | null,
    ) {
      if (!oportunidade || !this.data.data) return;

      const existing = this.getOportunidadeFromState(oportunidade.id);
      const nextData = this.data.data.filter(
        (item) => item.id !== oportunidade.id,
      );
      nextData.push(oportunidade);

      if (!existing) {
        this.updateBoardTotal(oportunidade.board_id, 1);
        this.data.total += 1;
      } else {
        const previousBucketId = this.resolveBoardBucketId(
          previousBoardId ?? existing.board_id,
        );
        const nextBucketId = this.resolveBoardBucketId(oportunidade.board_id);

        if (previousBucketId !== nextBucketId) {
          this.updateBoardTotal(previousBucketId, -1);
          this.updateBoardTotal(nextBucketId, 1);
        }
      }

      this.$patch({
        data: {
          ...this.data,
          data: this.sortOportunidadesData(nextData),
        },
      });
    },
    removeRealtimeOportunidade(id: number, previousBoardId?: number | null) {
      if (!id || !this.data.data) return;

      const existing = this.getOportunidadeFromState(id);
      if (!existing) return;

      this.updateBoardTotal(previousBoardId ?? existing.board_id, -1);
      this.data.total = Math.max(0, this.data.total - 1);
      this.removeOportunidadeFromState(id);
    },
    mapRealtimeOportunidade(
      oportunidade: OportunidadeRealtimeResponse,
    ): OportunidadeData {
      return {
        id: oportunidade.id,
        tipo: oportunidade.tipo || "",
        descricao: oportunidade.descricao || "",
        statusInt: oportunidade.statusInt || 0,
        board_id: (oportunidade.board_id ?? null) as any,
        motivo_atual: oportunidade.motivo_atual || null,
        posicao: oportunidade.posicao || 0,
        criado: oportunidade.criado,
        atualizado: oportunidade.atualizado,
        desativado: oportunidade.desativado || false,
        responsavel_atual: oportunidade.responsavel_atual || null,
        responsaveis: oportunidade.responsaveis || [],
        _count: oportunidade._count || { responsaveis: 0 },
        lead: oportunidade.lead || {
          nome_lead: "",
          localizacoes: [],
        },
      };
    },
    async fetchRealtimeOportunidadeById(id: number) {
      try {
        const res = await useApi<OportunidadeRealtimeResponse>(
          `/api/oportunidades/${id}`,
          {
            method: "GET",
          },
        );

        if (!res) return null;
        return this.mapRealtimeOportunidade(res);
      } catch {
        return null;
      }
    },
    clearPage() {
      this.page = 1;
      this.hasMoreBoards = true;
      this.boardTotals = {};
      this.boardPages = {};
      this.boardHasMore = {};
      this.boardLoadingMore = {};
      this.data = {
        total: 0,
        data: [],
        page: 0,
        totalPages: 0,
      };
    },
    clearFilters() {
      this.page = 1;
      this.perPage = 25;
      this.filterByName = null;
      this.filterByUserId = "all";
      this.filterByCity = "all";
      this.filterByStatus = "all";
      this.filterByRange = "all";
      this.filterByBetweenDates = null;
      this.filterByInteractionDates = null;
      this.filterByGroupIds = [];
      this.filterByDisabledMode = "without";
    },
    setFilterByDisabledMode(value: "without" | "with" | "only") {
      this.filterByDisabledMode = value;
    },
    setFilterByBetweenDates(value: string[] | null) {
      this.filterByBetweenDates = value;
    },
    setFilterByInteractionDates(value: string[] | null) {
      this.filterByInteractionDates = value;
    },
    setFilterByStatus(value: number | string) {
      this.filterByStatus = value;
    },
    setFilterByRange(value: string) {
      this.filterByRange = value;
    },
    setFilterByCity(value: string) {
      this.filterByCity = value;
    },
    setFilterByName(value: string | null) {
      this.filterByName = value;
    },
    setFilterByUserId(value: number | string) {
      this.filterByUserId = value;
    },
    setFilterByGroupIds(value: number[] | null) {
      this.filterByGroupIds = value || [];
    },
    setIsBoardLoading(value: boolean) {
      this.boards.isLoading = value;
    },
    setIsSubmitting(value: boolean) {
      this.isSubmitting = value;
    },
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setIsLoadingMore(value: boolean) {
      this.isLoadingMore = value;
    },
    setBoardLoadingMore(boardId: number, value: boolean) {
      this.boardLoadingMore = {
        ...this.boardLoadingMore,
        [boardId]: value,
      };
    },
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    async handlePageChange(newPage: number) {
      this.page = newPage;
      await this.findAll();
    },
    buildQueryParams(): Record<string, any> {
      const queryParams: Record<string, any> = {
        page: this.page,
        perPage: this.perPage,
      };

      if (this.filterByUserId && this.filterByUserId !== "all")
        queryParams.userId = this.filterByUserId;
      if (this.filterByName) queryParams.name = this.filterByName;
      if (this.filterByCity && this.filterByCity !== "all")
        queryParams.city = this.filterByCity;
      if (this.filterByStatus && this.filterByStatus !== "all")
        queryParams.status = this.filterByStatus;
      if (this.filterByRange && this.filterByRange !== "all")
        queryParams.range = this.filterByRange;
      if (this.filterByBetweenDates && this.filterByBetweenDates.length > 0) {
        queryParams.startDate = this.filterByBetweenDates[0];
        queryParams.endDate = this.filterByBetweenDates[1];
      }
      if (
        this.filterByInteractionDates &&
        this.filterByInteractionDates.length > 0
      ) {
        queryParams.interactionStartDate = this.filterByInteractionDates[0];
        queryParams.interactionEndDate = this.filterByInteractionDates[1];
      }
      if (this.filterByGroupIds && this.filterByGroupIds.length > 0) {
        queryParams.groupIds = this.filterByGroupIds.join(",");
      }
      if (this.filterByDisabledMode) {
        queryParams.disabledMode = this.filterByDisabledMode;
      }

      return queryParams;
    },
    async updateBoardStatusById(board_id: number | null, posicao: number) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(
          `/api/oportunidades/board/${board_id}/status`,
          {
            method: "PATCH",
            body: {
              board_id,
              posicao,
            },
          },
        );

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async deleteBoard(id: number) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<Board>(`/api/oportunidades/board/${id}`, {
          method: "DELETE",
        });

        this.removeBoardFromState(id);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async createBoard(data: FormBoardCreate) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<Board>("/api/oportunidades/board", {
          method: "POST",
          body: {
            titulo: data.titulo,
            descricao: data.descricao,
            cor: data.cor,
            posicao: data.posicao,
            qualificacao: data.qualificacao,
            controle_lembretes: data.controle_lembretes ?? true,
            exige_motivo: data.exige_motivo ?? false,
            grupo_motivos: data.grupo_motivos ?? null,
            motivos: data.motivos ?? [],
            exigir_obs_outro: data.exigir_obs_outro ?? false,
            usuario_atribuido_id: data.usuario_atribuido_id ?? null,
          },
        });

        this.addBoardToState(res);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async editBoard(id: number, data: any) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<Board>(`/api/oportunidades/board/${id}`, {
          method: "PATCH",
          body: {
            titulo: data.titulo,
            descricao: data.descricao,
            cor: data.cor,
            qualificacao: data.qualificacao,
            controle_lembretes: data.controle_lembretes ?? true,
            exige_motivo: data.exige_motivo ?? false,
            grupo_motivos: data.grupo_motivos ?? null,
            motivos: data.motivos ?? [],
            exigir_obs_outro: data.exigir_obs_outro ?? false,
            usuario_atribuido_id: data.usuario_atribuido_id ?? null,
          },
        });

        this.updateBoardFromState(id, res);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async findAllBoards() {
      this.setIsBoardLoading(true);

      try {
        const res = await useApi<Board[]>("/api/oportunidades/board", {
          method: "GET",
        });

        this.boards.data = res;
        this.setIsBoardLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      }
    },
    async findAll() {
      this.setIsLoading(true);

      try {
        this.setIsLoadingMore(false);
        const queryParams = this.buildQueryParams();
        const res = await useApi<BoardCardsResponse>(
          "/api/oportunidades/board/cards",
          {
            method: "GET",
            query: queryParams,
          },
        );

        const allItems = res?.boards?.flatMap((b) => b.items) || [];

        this.boardTotals = Object.fromEntries(
          (res?.boards || []).map((b) => [b.board_id, b.total]),
        );
        this.boardPages = Object.fromEntries(
          (res?.boards || []).map((b) => [b.board_id, 1]),
        );
        this.boardHasMore = Object.fromEntries(
          (res?.boards || []).map((b) => [b.board_id, b.hasMore]),
        );
        this.data = {
          total: res?.total || 0,
          data: allItems,
          page: res?.page || 1,
          totalPages: 0,
        };
        this.hasMoreBoards = !!res?.hasMore;
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      }
    },
    async loadMore(boardId: number) {
      if (this.isLoading) return false;
      if (!this.boardHasMore?.[boardId]) return false;
      if (this.boardLoadingMore?.[boardId]) return false;

      this.setBoardLoadingMore(boardId, true);
      try {
        const nextPage = (this.boardPages?.[boardId] || 1) + 1;
        const queryParams = {
          ...this.buildQueryParams(),
          page: nextPage,
          boardId,
        };
        const res = await useApi<BoardCardsResponse>(
          "/api/oportunidades/board/cards",
          {
            method: "GET",
            query: queryParams,
          },
        );

        const boardRes = res?.boards?.[0];
        const items = boardRes?.items || [];
        if (items.length) {
          const existing = new Map(
            (this.data.data || []).map((item) => [item.id, item]),
          );
          items.forEach((item) => existing.set(item.id, item));
          this.data = {
            total:
              res?.boardId !== undefined
                ? this.data.total
                : res?.total !== undefined
                  ? res.total
                  : this.data.total,
            data: Array.from(existing.values()),
            page: this.page,
            totalPages: 0,
          };
        }

        if (boardRes) {
          this.boardTotals = {
            ...this.boardTotals,
            [boardId]: boardRes.total,
          };
          this.boardHasMore = {
            ...this.boardHasMore,
            [boardId]: boardRes.hasMore,
          };
          this.boardPages = {
            ...this.boardPages,
            [boardId]: nextPage,
          };
        }
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setBoardLoadingMore(boardId, false);
      }
    },
  },
});
