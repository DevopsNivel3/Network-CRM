import dayjs from "dayjs";
import type {
  ComentarioData,
  InteracaoData,
  InteracaoResponse,
  OportunidadeCommentsResponse,
  OportunidadeCreateResponse,
  OportunidadeData,
  OportunidadeState,
  ResponsavelData,
  VisitaData,
} from "~/types/oportunidade";

const toApiAnexos = (anexos: any[] = []) =>
  (anexos || [])
    .map((item) => ({
      nome: item?.nome ?? item?.name,
      url: item?.url,
      tipo: item?.tipo ?? item?.type,
      tamanho: item?.tamanho ?? item?.size,
    }))
    .filter((item) => item.nome && item.url);

// Store para salvar os dados da Oportunidade
export const useOportunidade = defineStore("oportunidade", {
  state: (): OportunidadeState => ({
    data: null,
    visitas: {
      data: [],
      isLoading: false,
    },
    responsaveis: {
      data: {
        total: 0,
        data: null,
      },
      isLoading: false,
    },
    interacoes: {
      data: {
        total: 0,
        data: null,
        page: 0,
        totalPages: 0,
      },
      page: 1,
      perPage: 5,
      isLoading: false,
    },
    comments: {
      data: {
        total: 0,
        data: null,
        page: 0,
        totalPages: 0,
      },
      page: 1,
      perPage: 3,
      isLoading: false,
    },
    isLoading: false,
    isSubmitting: false,
  }),
  getters: {
    hasVisitas(state): boolean {
      return !!state.visitas.data.length;
    },
    hasInteracoes(state): boolean {
      return !!state.interacoes.data.data?.length;
    },
    hasMoreInteracoes(state): boolean {
      return state.interacoes.page < state.interacoes.data.totalPages;
    },
    hasMoreComments(state): boolean {
      return state.comments.page < state.comments.data.totalPages;
    },
    getTipoInteracao(): Record<number, string> {
      return {
        1: "MENSAGEM",
        2: "EMAIL",
        3: "TELEFONE",
      };
    },
    getStatusInteracao(): Record<number, string> {
      return {
        1: "ENVIADA",
        2: "RESPONDIDA",
        3: "IGNORADA",
        4: "ENVIADO",
        5: "RESPONDIDO",
        6: "NÃO RESPONDIDO",
        7: "ATENDIDA",
        8: "NÃO ATENDIDA",
        9: "OCUPADO",
      };
    },
    tipoInteracaoOptions(): { value: number; label: string }[] {
      return [
        { value: 1, label: "MENSAGEM" },
        { value: 2, label: "EMAIL" },
        { value: 3, label: "TELEFONE" },
      ];
    },
    statusInteracaoOptions(): Record<
      number,
      { value: number; label: string }[]
    > {
      return {
        1: [
          { value: 1, label: "ENVIADA" },
          { value: 2, label: "RESPONDIDA" },
          { value: 3, label: "IGNORADA" },
        ],
        2: [
          { value: 4, label: "ENVIADO" },
          { value: 5, label: "RESPONDIDO" },
          { value: 6, label: "NÃO RESPONDIDO" },
        ],
        3: [
          { value: 7, label: "ATENDIDA" },
          { value: 8, label: "NÃO ATENDIDA" },
          { value: 9, label: "OCUPADO" },
        ],
      };
    },
  },
  actions: {
    resetData() {
      this.$patch({
        data: null,
        visitas: {
          data: [],
          isLoading: false,
        },
        responsaveis: {
          data: {
            total: 0,
            data: null,
          },
          isLoading: false,
        },
        interacoes: {
          data: {
            total: 0,
            data: null,
            page: 0,
            totalPages: 0,
          },
          page: 1,
          perPage: 5,
          isLoading: false,
        },
        comments: {
          data: {
            total: 0,
            data: null,
            page: 0,
            totalPages: 0,
          },
          page: 1,
          perPage: 3,
          isLoading: false,
        },
        isLoading: false,
        isSubmitting: false,
      });
    },
    setInteracaoIsLoading(value: boolean) {
      this.interacoes.isLoading = value;
    },
    setVisitasIsLoading(value: boolean) {
      this.visitas.isLoading = value;
    },
    setCommentsIsLoading(value: boolean) {
      this.comments.isLoading = value;
    },
    resetComments() {
      this.comments = {
        data: {
          total: 0,
          data: null,
          page: 0,
          totalPages: 0,
        },
        page: 1,
        perPage: 3,
        isLoading: false,
      };
    },
    setResponsavelIsLoading(value: boolean) {
      this.responsaveis.isLoading = value;
    },
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setIsSubmitting(value: boolean) {
      this.isSubmitting = value;
    },
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    syncLeadOportunidadesCache() {
      const leadStore = useLead();
      const openedLeadId = leadStore.data?.id;
      const oportunidadeLeadId = this.data?.lead?.id;
      const oportunidadeId = this.data?.id;

      if (!openedLeadId || !oportunidadeLeadId || !oportunidadeId) return;
      if (openedLeadId !== oportunidadeLeadId) return;

      const responsaveisPreview = (
        this.data?.responsaveis?.length
          ? this.data.responsaveis
          : this.responsaveis.data.data || []
      ).slice(0, 2);
      const responsaveisTotal =
        this.data?._count?.responsaveis ??
        this.responsaveis.data.total ??
        responsaveisPreview.length;

      leadStore.updateOportunidadeFromState(oportunidadeId, {
        tipo: this.data?.tipo ?? null,
        descricao: this.data?.descricao ?? null,
        statusInt: this.data?.statusInt ?? null,
        board_id: this.data?.board_id ?? null,
        desativado: this.data?.desativado,
        atualizado: this.data?.atualizado ?? new Date().toISOString(),
        usuario: this.data?.usuario,
        responsaveis: responsaveisPreview,
        _count: {
          responsaveis: responsaveisTotal,
        },
      });
    },

    // Estado das visitas
    addVisitaFromState(data: VisitaData) {
      if (!data) return;
      this.visitas.data = [...this.visitas.data, data];
    },
    updateVisitaFromState(id: number, data: Partial<VisitaData>) {
      if (!id || !data || !this.visitas.data.length) return;
      this.visitas.data = this.visitas.data.map((item) =>
        item.id === id ? { ...item, ...data } : item,
      );
    },

    // Estado dos comentários
    addCommentFromState(data: ComentarioData) {
      if (!data) return;

      const existing = this.comments.data.data ?? [];
      const updated = [data, ...existing];
      const total = (this.comments.data.total || 0) + 1;
      const totalPages = total ? Math.ceil(total / this.comments.perPage) : 0;

      this.comments.data = {
        ...this.comments.data,
        data: updated,
        total,
        totalPages,
      };
    },
    updateCommentFromState(id: number, data: ComentarioData) {
      if (!id || !this.comments.data.data) return;

      this.comments.data = {
        ...this.comments.data,
        data: this.comments.data.data.map((item) =>
          item.id === id ? { ...item, ...data } : item,
        ),
      };
    },
    deleteCommentFromState(id: number) {
      if (!id) return;

      if (!this.comments.data.data) return;
      const index = this.comments.data.data.findIndex((item) => item.id === id);
      if (index === -1) return;

      const updated = [...this.comments.data.data];
      updated.splice(index, 1);

      const total = Math.max((this.comments.data.total || 1) - 1, 0);
      const totalPages = total ? Math.ceil(total / this.comments.perPage) : 0;

      this.comments.data = {
        ...this.comments.data,
        data: updated,
        total,
        totalPages,
      };
    },
    updateInteracaoFromState(id: number, data: any) {
      if (!id || !data || !this.interacoes.data.data) return;

      this.$patch({
        interacoes: {
          ...this.interacoes,
          data: {
            ...this.interacoes.data,
            data: this.interacoes.data.data!.map((item) =>
              item.id === id ? { ...item, ...data } : item,
            ),
          },
        },
      });
    },

    // Estado das interações
    addInteracaoFromState(data: InteracaoData) {
      if (!data) return;

      this.$patch({
        interacoes: {
          ...this.interacoes,
          data: {
            ...this.interacoes.data,
            data: Array.isArray(this.interacoes.data.data)
              ? [...this.interacoes.data.data, data]
              : [data],
          },
        },
      });
    },
    deleteInteracaoFromState(id: number) {
      if (!id) return;

      const index = this.interacoes.data.data!.findIndex(
        (item) => item.id === id,
      );
      if (index !== undefined && index !== -1)
        this.interacoes.data.data!.splice(index, 1);
    },

    // Responsaveis
    async findAllResponsaveis(id: number): Promise<boolean> {
      this.setResponsavelIsLoading(true);

      try {
        const res = await useApi<{
          total: number;
          data: ResponsavelData[] | null;
        }>(`/api/oportunidades/${id}/responsaveis`, {
          method: "GET",
        });

        this.responsaveis.data = res;
        if (this.data?._count) this.data._count.responsaveis = res.total;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setResponsavelIsLoading(false);
      }
    },

    async addResponsaveis(id: number, userIds: number[]): Promise<boolean> {
      if (!userIds.length) return true;
      this.setIsSubmitting(true);

      try {
        const res = await useApi<{
          added: number[];
          created?: Record<number, string>;
        }>(`/api/oportunidades/${id}/responsaveis`, {
          method: "POST",
          body: {
            user_ids: userIds,
          },
        });

        if (res) {
          const addedIds = res.added ?? [];
          const addedSet = new Set(addedIds);

          if (this.responsaveis.data.data) {
            const existingSet = new Set(
              this.responsaveis.data.data.map((item) => item.usuario.id),
            );

            const usuariosStore = useUsuarios();
            const usuariosById = new Map(
              (usuariosStore.data.data ?? []).map((u) => [u.id, u]),
            );

            const newItems = addedIds
              .filter((id) => !existingSet.has(id))
              .map((id) => {
                const user = usuariosById.get(id);
                if (!user) return null;
                return {
                  usuario: {
                    id: user.id,
                    nome: user.nome,
                    avatar: user.avatar,
                  },
                  criado: new Date().toISOString(),
                } as ResponsavelData;
              })
              .filter(Boolean) as ResponsavelData[];

            if (newItems.length) {
              this.responsaveis.data.data = [
                ...this.responsaveis.data.data,
                ...newItems,
              ].sort(
                (a, b) =>
                  new Date(b.criado || 0).getTime() -
                  new Date(a.criado || 0).getTime(),
              );
            }
          }

          if (this.data?.responsaveis) {
            const existingSet = new Set(
              this.data.responsaveis.map((item) => item.usuario.id),
            );
            const usuariosStore = useUsuarios();
            const usuariosById = new Map(
              (usuariosStore.data.data ?? []).map((u) => [u.id, u]),
            );
            const toAdd = addedIds
              .filter((id) => !existingSet.has(id))
              .map((id) => {
                const user = usuariosById.get(id);
                if (!user) return null;
                return {
                  usuario: {
                    id: user.id,
                    nome: user.nome,
                    avatar: user.avatar,
                  },
                  criado: res.created?.[id] ?? new Date().toISOString(),
                } as ResponsavelData;
              })
              .filter(Boolean) as ResponsavelData[];

            if (toAdd.length) {
              const merged = [...this.data.responsaveis, ...toAdd].sort(
                (a, b) =>
                  new Date(b.criado || 0).getTime() -
                  new Date(a.criado || 0).getTime(),
              );
              this.data.responsaveis = merged.slice(0, 2);
            }
          }

          const nextTotal = this.responsaveis.data.total + addedSet.size;
          this.responsaveis.data.total = nextTotal;
          if (this.data?._count) this.data._count.responsaveis = nextTotal;
        }
        if (res) this.syncLeadOportunidadesCache();
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },

    async updateResponsavelPerms(
      oportunidadeId: number,
      userId: number,
      data: {
        principal?: boolean;
        gerencia_responsaveis?: boolean;
        pode_editar?: boolean;
        pode_interacoes?: boolean;
        pode_visitas?: boolean;
      },
    ): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<{ ok: boolean }>(
          `/api/oportunidades/${oportunidadeId}/responsaveis`,
          {
            method: "PATCH",
            body: {
              user_id: userId,
              ...data,
            },
          },
        );

        if (res?.ok && this.responsaveis.data.data) {
          this.responsaveis.data.data = this.responsaveis.data.data.map(
            (item) => {
              if (data.principal) {
                return item.usuario.id === userId
                  ? { ...item, ...data }
                  : { ...item, principal: false };
              }
              return item.usuario.id === userId ? { ...item, ...data } : item;
            },
          );
        }

        if (res?.ok && this.data?.responsaveis) {
          this.data.responsaveis = this.data.responsaveis.map((item) => {
            if (data.principal) {
              return item.usuario.id === userId
                ? { ...item, ...data }
                : { ...item, principal: false };
            }
            return item.usuario.id === userId ? { ...item, ...data } : item;
          });
        }

        const { user } = useAuthSession();
        if (res?.ok && this.data?.responsavel_atual && userId === user.id) {
          this.data.responsavel_atual = {
            ...this.data.responsavel_atual,
            ...data,
          };
        }

        if (res?.ok) this.syncLeadOportunidadesCache();
        return res?.ok ?? false;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },

    async removeResponsaveis(id: number, userIds: number[]): Promise<boolean> {
      if (!userIds.length) return true;
      this.setIsSubmitting(true);

      try {
        const res = await useApi<{ removed: number[]; count: number }>(
          `/api/oportunidades/${id}/responsaveis`,
          {
            method: "DELETE",
            body: {
              user_ids: userIds,
            },
          },
        );

        if (res) {
          if (this.responsaveis.data.data) {
            const removedSet = new Set(res.removed);
            this.responsaveis.data.data = this.responsaveis.data.data.filter(
              (item) => !removedSet.has(item.usuario.id),
            );
          }

          if (this.data?.responsaveis) {
            const removedSet = new Set(res.removed);
            this.data.responsaveis = this.data.responsaveis.filter(
              (item) => !removedSet.has(item.usuario.id),
            );
          }

          const nextTotal = Math.max(
            0,
            this.responsaveis.data.total - (res.count ?? 0),
          );
          this.responsaveis.data.total = nextTotal;
          if (this.data?._count) this.data._count.responsaveis = nextTotal;
        }
        if (res) this.syncLeadOportunidadesCache();
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },

    // Comentários
    async deleteComment(id: number, commentId: number) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(`/api/oportunidades/${id}/comment`, {
          method: "DELETE",
          body: {
            comment_id: commentId,
          },
        });

        if (res) this.deleteCommentFromState(commentId);

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async editComment(
      id: number,
      commentId: number,
      content: string,
      anexos: ComentarioData["anexos"] = [],
    ) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<ComentarioData>(
          `/api/oportunidades/${id}/comment`,
          {
            method: "PUT",
            body: {
              comment_id: commentId,
              descricao: content,
              anexos: toApiAnexos(anexos as any[]),
            },
          },
        );

        if (res) this.updateCommentFromState(commentId, res);

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async sendComment(
      id: number,
      content: string,
      anexos: ComentarioData["anexos"] = [],
    ) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<ComentarioData>(
          `/api/oportunidades/${id}/comment`,
          {
            method: "POST",
            body: {
              descricao: content,
              anexos: toApiAnexos(anexos as any[]),
            },
          },
        );

        if (res) this.addCommentFromState(res);

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async loadMoreComments(id: number): Promise<boolean> {
      const nextPage = this.comments.page + 1;
      const totalPages = this.comments.data.totalPages;

      if (nextPage > totalPages || this.comments.isLoading) return false;

      return await this.fetchComments(id, nextPage);
    },
    async fetchComments(id: number, page: number = 1): Promise<boolean> {
      if (page === 1) this.setCommentsIsLoading(true);

      try {
        const res = await useApi<OportunidadeCommentsResponse>(
          `/api/oportunidades/${id}/comment?page=${page}&perPage=${this.comments.perPage}`,
          {
            method: "GET",
          },
        );

        if (page === 1) {
          this.comments.data = res;
        } else {
          const combined = [
            ...(this.comments.data.data || []),
            ...(res.data || []),
          ];
          this.comments.data = {
            ...res,
            data: combined,
          };
        }

        this.comments.page = page;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setCommentsIsLoading(false);
      }
    },

    // Interações
    async deleteInteracao(id: number, interacaoId: number) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(
          `/api/oportunidades/${id}/interacoes`,
          {
            method: "DELETE",
            body: {
              interacao_id: interacaoId,
            },
          },
        );

        if (res) this.deleteInteracaoFromState(interacaoId);

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async createInteracao(id: number, data: any) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<InteracaoData>(
          `/api/oportunidades/${id}/interacoes`,
          {
            method: "POST",
            body: {
              tipo: data.tipo,
              conteudo: data.conteudo,
              data: data.data,
              status: data.status,
              anexos: toApiAnexos(data.anexos || []),
            },
          },
        );
        if (res) this.addInteracaoFromState(res);
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async editInteracao(id: number, interacaoId: number, data: any) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<InteracaoData>(
          `/api/oportunidades/${id}/interacoes`,
          {
            method: "PUT",
            body: {
              interacao_id: interacaoId,
              tipo: data.tipo,
              conteudo: data.conteudo,
              data: data.data,
              status: data.status,
              anexos: toApiAnexos(data.anexos || []),
            },
          },
        );
        if (res) this.updateInteracaoFromState(interacaoId, res);
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async loadMoreInteracoes(id: number): Promise<boolean> {
      const nextPage = this.interacoes.page + 1;
      const totalPages = this.interacoes.data.totalPages;

      if (nextPage > totalPages || this.interacoes.isLoading) return false;

      return await this.findAllInteracoes(id, nextPage);
    },
    async findAllInteracoes(id: number, page: number = 1): Promise<boolean> {
      if (page === 1) this.setInteracaoIsLoading(true);

      try {
        const res = await useApi<InteracaoResponse>(
          `/api/oportunidades/${id}/interacoes?page=${page}&perPage=${this.interacoes.perPage}`,
          {
            method: "GET",
          },
        );

        if (page === 1) {
          res.data =
            res.data?.sort(
              (a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf(),
            ) ?? [];
          this.interacoes.data = res;
        } else {
          const combined = [
            ...(this.interacoes.data.data || []),
            ...(res.data || []),
          ];
          this.interacoes.data = {
            ...res,
            data: combined.sort(
              (a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf(),
            ),
          };
        }

        this.interacoes.page = page;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setInteracaoIsLoading(false);
      }
    },

    // Oportunidades
    async fetchVisitas(id: number): Promise<boolean> {
      this.setVisitasIsLoading(true);

      try {
        const res = await useApi<VisitaData[]>(
          `/api/oportunidades/${id}/visitas`,
          {
            method: "GET",
          },
        );

        this.visitas.data = res ?? [];
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setVisitasIsLoading(false);
      }
    },
    async updateStatusById(
      id: number,
      board_id: number | null,
      posicao: number,
      moveReason?: { motivo: string; motivo_observacao?: string | null },
    ) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(`/api/oportunidades/${id}/status`, {
          method: "PATCH",
          body: {
            board_id,
            posicao,
            motivo: moveReason?.motivo,
            motivo_observacao: moveReason?.motivo_observacao,
          },
        });

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async updateById(id: number, data: any): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const previousData = this.data;
        const res = await useApi<Partial<OportunidadeData>>(
          `/api/oportunidades/${id}`,
          {
            method: "PATCH",
            body: data,
          },
        );

        if (res) {
          this.data = {
            ...(previousData || ({} as OportunidadeData)),
            ...res,
            responsaveis:
              res.responsaveis ??
              previousData?.responsaveis ??
              this.responsaveis.data.data ??
              [],
            _count: res._count ??
              previousData?._count ?? {
                responsaveis:
                  this.responsaveis.data.total ||
                  this.responsaveis.data.data?.length ||
                  0,
              },
            responsavel_atual:
              res.responsavel_atual ?? previousData?.responsavel_atual ?? null,
          } as OportunidadeData;
          this.syncLeadOportunidadesCache();
        }
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async create(data: any): Promise<OportunidadeCreateResponse | null> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<OportunidadeCreateResponse>(
          "/api/oportunidades",
          {
            method: "POST",
            body: data,
          },
        );

        return res ?? null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return null;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async findById(id: string | number): Promise<boolean> {
      this.setIsLoading(true);
      this.resetComments();

      try {
        const res = await useApi<OportunidadeData>(`/api/oportunidades/${id}`, {
          method: "GET",
        });

        this.data = res;
        this.visitas.data = res?.visitas ?? [];
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsLoading(false);
      }
    },
  },
});
