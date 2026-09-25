interface LeadGroupData {
  id: number;
  nome: string;
  descricao: string | null;
  criado?: string;
  atualizado?: string;
  usuario?: {
    id: number;
    nome: string;
  } | null;
}

interface LeadGroupsResponse {
  total: number;
  data: LeadGroupData[] | null;
  page: number;
  totalPages: number;
}

interface LeadGroupsState {
  data: LeadGroupsResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  isSubmitting: boolean;
  filterByName: string | null;
}

interface LeadGroupOption {
  label: string;
  value: number;
}

export const useLeadGroups = defineStore("leadGroups", {
  state: (): LeadGroupsState => ({
    data: {
      total: 0,
      data: [],
      page: 0,
      totalPages: 0,
    },
    page: 1,
    perPage: 100,
    isLoading: false,
    isSubmitting: false,
    filterByName: null,
  }),
  getters: {
    formattedOptions(state): LeadGroupOption[] {
      return (state.data.data || []).map((item) => ({
        value: item.id,
        label: item.nome,
      }));
    },
  },
  actions: {
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setIsSubmitting(value: boolean) {
      this.isSubmitting = value;
    },
    setFilterByName(value: string | null) {
      this.filterByName = value;
    },
    clearFilters() {
      this.page = 1;
      this.perPage = 100;
      this.filterByName = null;
    },
    clearPage() {
      this.page = 1;
    },
    createFromState(group: LeadGroupData) {
      if (!this.data.data) this.data.data = [];

      const exists = this.data.data.some((item) => item.id === group.id);
      if (exists) return;

      this.data.data = [group, ...this.data.data];
      this.data.total += 1;
    },
    updateFromState(group: LeadGroupData) {
      if (!this.data.data) return;

      this.data.data = this.data.data.map((item) =>
        item.id === group.id ? { ...item, ...group } : item,
      );
    },
    removeFromState(id: number) {
      if (!this.data.data) return;

      const hadItem = this.data.data.some((item) => item.id === id);
      this.data.data = this.data.data.filter((item) => item.id !== id);
      if (hadItem) this.data.total = Math.max(0, this.data.total - 1);
    },
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    buildQueryParams(): Record<string, any> {
      const queryParams: Record<string, any> = {
        page: this.page,
        perPage: this.perPage,
      };
      if (this.filterByName) queryParams.name = this.filterByName;
      return queryParams;
    },
    async handlePageChange(newPage: number) {
      this.page = newPage;
      await this.findAll();
    },
    async findAll() {
      this.setIsLoading(true);

      try {
        const res = await useApi<LeadGroupsResponse>("/api/leads/grupos", {
          method: "GET",
          query: this.buildQueryParams(),
        });

        if (res) this.data = res;
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setIsLoading(false);
      }
    },
    async create(payload: { nome: string; descricao?: string | null }) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<LeadGroupData>("/api/leads/grupos", {
          method: "POST",
          body: payload,
        });

        if (res) this.createFromState(res);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async update(
      id: number,
      payload: { nome?: string; descricao?: string | null },
    ) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<LeadGroupData>(`/api/leads/grupos/${id}`, {
          method: "PATCH",
          body: payload,
        });

        if (res) this.updateFromState(res);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async remove(id: number) {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(`/api/leads/grupos/${id}`, {
          method: "DELETE",
        });

        if (res) this.removeFromState(id);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
  },
});
