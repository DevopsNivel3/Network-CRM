interface LeadData {
  id: number;
  nome_lead: string;
  cpf_cnpj: string | null;
  contato: string;
  contato_nome: string | null;
  responsavel: string | null;
  atividade: string | null;
  origem_lead: string | null;
  status_lead: string;
  status_cor: string | null;
  ultima_interacao: string | null;
  proximo_follow_up: string | null;
  sem_interacao: boolean;
  prioridade: "alta" | "media" | "normal";
  usuario: {
    id: number;
    nome: string;
    avatar: string | null;
  };
  criado: string;
  atualizado: string;
}

interface LeadsResponse {
  total: number;
  data: LeadData[] | null;
  page: number;
  totalPages: number;
}

interface LeadsState {
  data: LeadsResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  filterByUserId: number | string;
  filterByName: string | null;
  filterByCity: string;
  filterByOrigin: string;
  filterByStatus: number | string;
  filterWithoutInteraction: boolean;
  filterByGroupIds: number[];
  filterByBetweenDates: string[] | null;
  filterByInteractionDates: string[] | null;
  sortBy: string;
  sortOrder: "ascending" | "descending" | null;
}

interface LeadsList {
  value: number;
  label: string;
}

// Store para salvar os dados de todos os Leads
export const useLeads = defineStore("leads", {
  state: (): LeadsState => ({
    data: {
      total: 0,
      data: null,
      page: 0,
      totalPages: 0,
    },
    page: 1,
    perPage: 100,
    isLoading: false,
    filterByUserId: "all",
    filterByName: null,
    filterByCity: "all",
    filterByOrigin: "all",
    filterByStatus: "all",
    filterWithoutInteraction: false,
    filterByGroupIds: [],
    filterByBetweenDates: null,
    filterByInteractionDates: null,
    sortBy: "atualizado",
    sortOrder: "descending",
  }),
  getters: {
    formattedOptions(state): LeadsList[] {
      return state.data.data
        ? state.data.data.map((item) => ({
            value: item.id,
            label: item.nome_lead,
          }))
        : [];
    },
  },
  actions: {
    removeLeadFromState(id: number) {
      if (!this.data.data) return;

      const index = this.data.data.findIndex((item) => item.id === id);
      if (index !== undefined && index !== -1) {
        this.data.data.splice(index, 1);
        this.data.total = Math.max(0, this.data.total - 1);
      }
    },
    clearPage() {
      this.page = 1;
    },
    clearFilters() {
      this.page = 1;
      this.perPage = 100;
      this.filterByName = null;
      this.filterByUserId = "all";
      this.filterByCity = "all";
      this.filterByOrigin = "all";
      this.filterByStatus = "all";
      this.filterWithoutInteraction = false;
      this.filterByGroupIds = [];
      this.filterByBetweenDates = null;
      this.filterByInteractionDates = null;
      this.sortBy = "atualizado";
      this.sortOrder = "descending";
    },
    setFilterByBetweenDates(value: string[] | null) {
      this.filterByBetweenDates = value;
    },
    setFilterByInteractionDates(value: string[] | null) {
      this.filterByInteractionDates = value;
    },
    setFilterByCity(value: string) {
      this.filterByCity = value;
    },
    setFilterByOrigin(value: string) {
      this.filterByOrigin = value;
    },
    setFilterByStatus(value: number | string) {
      this.filterByStatus = value;
    },
    setFilterWithoutInteraction(value: boolean) {
      this.filterWithoutInteraction = value;
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
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    async handlePageChange(newPage: number) {
      this.page = newPage;
      await this.findAll();
    },
    async handleSortChange({
      prop,
      order,
    }: {
      prop: string;
      order: "ascending" | "descending" | null;
    }) {
      this.sortBy = prop || "atualizado";
      this.sortOrder = order || "descending";
      this.clearPage();
      await this.findAll();
    },
    buildQueryParams(): Record<string, any> {
      const queryParams: Record<string, any> = {
        page: this.page,
        perPage: this.perPage,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
      };

      if (this.filterByUserId && this.filterByUserId !== "all")
        queryParams.userId = this.filterByUserId;
      if (this.filterByName) queryParams.name = this.filterByName;
      if (this.filterByCity && this.filterByCity !== "all")
        queryParams.city = this.filterByCity;
      if (this.filterByOrigin && this.filterByOrigin !== "all")
        queryParams.origin = this.filterByOrigin;
      if (this.filterByStatus && this.filterByStatus !== "all")
        queryParams.status = this.filterByStatus;
      if (this.filterWithoutInteraction)
        queryParams.withoutInteraction = "true";
      if (this.filterByBetweenDates && this.filterByBetweenDates.length > 0) {
        queryParams.startDate = this.filterByBetweenDates[0];
        queryParams.endDate = this.filterByBetweenDates[1];
      }
      if (this.filterByInteractionDates && this.filterByInteractionDates.length > 0) {
        queryParams.interactionStartDate = this.filterByInteractionDates[0];
        queryParams.interactionEndDate = this.filterByInteractionDates[1];
      }
      if (this.filterByGroupIds && this.filterByGroupIds.length > 0) {
        queryParams.groupIds = this.filterByGroupIds.join(",");
      }

      return queryParams;
    },
    async findAll() {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<LeadsResponse>("/api/leads", {
          method: "GET",
          query: queryParams,
        });

        this.data = res;
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      }
    },
  },
});
