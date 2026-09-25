interface LocalizacaoData {
  id: number;
  rua: string;
  cidade: string;
  estado: string;
  complemento?: string;
  numero: string;
  cep: string;
}

interface UsuarioData {
  id: number;
  nome: string;
  avatar: string;
}

interface ComentarioData {
  id: number;
  descricao: string;
  usuario: UsuarioData;
  criado: string;
  atualizado: string;
  anexos?: {
    id: number;
    nome: string;
    url: string;
    tipo?: string | null;
    tamanho?: number | null;
    usuario_id?: number | null;
  }[];
}

const toApiAnexos = (anexos: any[] = []) =>
  (anexos || [])
    .map((item) => ({
      nome: item?.nome ?? item?.name,
      url: item?.url,
      tipo: item?.tipo ?? item?.type,
      tamanho: item?.tamanho ?? item?.size,
    }))
    .filter((item) => item.nome && item.url);

interface LeadGrupoData {
  id: number;
  nome: string;
  descricao: string | null;
}

interface LeadData {
  id: number;
  nome_lead: string;
  cpf_cnpj: string;
  contato: string;
  contato_nome: string;
  responsavel: string;
  faturamento: number;
  atividade: string;
  num_funcionarios: number;
  origem_lead: string;
  observacoes: string;
  controle_lembretes: boolean;
  localizacoes: LocalizacaoData[];
  grupos: LeadGrupoData[];
  usuario: UsuarioData;
  criado: string;
  atualizado: string;
}

interface LeadCommentsResponse {
  total: number;
  data: ComentarioData[] | null;
  page: number;
  totalPages: number;
}

interface LeadOportunidadeData {
  id: number;
  tipo: string | null;
  descricao: string | null;
  statusInt: number | null;
  board_id: number | null;
  desativado?: boolean;
  controle_lembretes?: boolean;
  criado: string;
  atualizado: string;
  usuario?: {
    id: number;
    nome: string;
    avatar: string;
  };
  responsaveis?: {
    principal?: boolean;
    usuario: {
      id: number;
      nome: string;
      avatar: string | null;
    };
  }[];
  _count?: {
    responsaveis: number;
  };
}

interface LeadOportunidadesResponse {
  total: number;
  data: LeadOportunidadeData[] | null;
  page: number;
  totalPages: number;
}

interface LeadState {
  data: LeadData | null;
  comments: {
    data: LeadCommentsResponse;
    page: number;
    perPage: number;
    isLoading: boolean;
  };
  oportunidades: {
    data: LeadOportunidadesResponse;
    page: number;
    perPage: number;
    isLoading: boolean;
  };
  isLoading: boolean;
  isSubmitting: boolean;
}

// Store para salvar os dados do Lead
export const useLead = defineStore("lead", {
  state: (): LeadState => ({
    data: null,
    comments: {
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
    oportunidades: {
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
    isLoading: false,
    isSubmitting: false,
  }),
  getters: {
    getLeadsStore() {
      return useLeads();
    },
    hasMoreComments(state): boolean {
      return state.comments.page < state.comments.data.totalPages;
    },
    hasMoreOportunidades(state): boolean {
      return state.oportunidades.page < state.oportunidades.data.totalPages;
    },
  },
  actions: {
    resetComments() {
      this.comments = {
        data: {
          total: 0,
          data: null,
          page: 0,
          totalPages: 0,
        },
        page: 1,
        perPage: 5,
        isLoading: false,
      };
    },
    resetOportunidades() {
      this.oportunidades = {
        data: {
          total: 0,
          data: null,
          page: 0,
          totalPages: 0,
        },
        page: 1,
        perPage: 5,
        isLoading: false,
      };
    },
    setCommentsIsLoading(value: boolean) {
      this.comments.isLoading = value;
    },
    setOportunidadesIsLoading(value: boolean) {
      this.oportunidades.isLoading = value;
    },
    addOportunidadeFromState(data: LeadOportunidadeData) {
      if (!data) return;

      const existing = this.oportunidades.data.data ?? [];
      const updated = [data, ...existing];
      const total = (this.oportunidades.data.total || 0) + 1;
      const totalPages = total
        ? Math.ceil(total / this.oportunidades.perPage)
        : 0;

      this.oportunidades.data = {
        ...this.oportunidades.data,
        data: updated,
        total,
        totalPages,
      };
    },
    updateOportunidadeFromState(
      id: number,
      data: Partial<LeadOportunidadeData>,
    ) {
      if (!id || !data || !this.oportunidades.data.data) return;

      this.oportunidades.data = {
        ...this.oportunidades.data,
        data: this.oportunidades.data.data.map((item) =>
          item.id === id ? { ...item, ...data } : item,
        ),
      };
    },
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
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setIsSubmitting(value: boolean) {
      this.isSubmitting = value;
    },
    setError(value: any) {
      useErr().setMessage(value);
    },
    async deleteComment(id: number, commentId: number) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(`/api/leads/${id}/comment`, {
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
        const res = await useApi<ComentarioData>(`/api/leads/${id}/comment`, {
          method: "PUT",
          body: {
            comment_id: commentId,
            descricao: content,
            anexos: toApiAnexos(anexos as any[]),
          },
        });

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
        const res = await useApi<ComentarioData>(`/api/leads/${id}/comment`, {
          method: "POST",
          body: {
            descricao: content,
            anexos: toApiAnexos(anexos as any[]),
          },
        });

        if (res) this.addCommentFromState(res);

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async fetchOportunidades(id: number, page = 1) {
      this.setOportunidadesIsLoading(true);
      if (page === 1) {
        this.oportunidades.data = {
          ...this.oportunidades.data,
          data: null,
        };
      }

      try {
        const res = await useApi<LeadOportunidadesResponse>(
          `/api/leads/${id}/oportunidades`,
          {
            method: "GET",
            query: {
              page,
              perPage: this.oportunidades.perPage,
            },
          },
        );

        this.oportunidades.data = res;
        this.oportunidades.page = res.page;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setOportunidadesIsLoading(false);
      }
    },
    async loadMoreOportunidades(id: number) {
      if (this.oportunidades.isLoading || !this.hasMoreOportunidades) return;

      const nextPage = this.oportunidades.page + 1;
      this.setOportunidadesIsLoading(true);

      try {
        const res = await useApi<LeadOportunidadesResponse>(
          `/api/leads/${id}/oportunidades`,
          {
            method: "GET",
            query: {
              page: nextPage,
              perPage: this.oportunidades.perPage,
            },
          },
        );

        const existing = this.oportunidades.data.data ?? [];
        const updated = [...existing, ...(res.data ?? [])];

        this.oportunidades.data = {
          ...res,
          data: updated,
        };
        this.oportunidades.page = res.page;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setOportunidadesIsLoading(false);
      }
    },
    async deleteById(id: number): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(`/api/leads/${id}`, {
          method: "DELETE",
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
        const res = await useApi<LeadData>(`/api/leads/${id}`, {
          method: "PATCH",
          body: data,
        });

        this.data = res;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data?.data || err?.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async create(data: FormLeadCreate): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>("/api/leads", {
          method: "POST",
          body: data,
        });

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data?.data || err?.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async findById(id: string | number): Promise<boolean> {
      this.setIsLoading(true);
      this.resetComments();

      try {
        const res = await useApi<LeadData>(`/api/leads/${id}`, {
          method: "GET",
        });

        this.data = res;
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
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
        const res = await useApi<LeadCommentsResponse>(
          `/api/leads/${id}/comment?page=${page}&perPage=${this.comments.perPage}`,
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
  },
});
