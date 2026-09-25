interface visitaData {
  id: number;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  statusInt: number;
  localizacao: {
    cidade: string;
    estado: string;
  };
  oportunidade: {
    id: number;
    lead: {
      nome_lead: string;
    };
  };
}

interface visitaResponse {
  total: number;
  data: visitaData[] | null;
  page: number;
  totalPages: number;
}

interface visitaState {
  data: visitaResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  filterByStatus: number | string;
  filterByName: string | null;
  filterByCity: string;
}

interface StatusOption {
  value: number;
  label: string;
}

// Store para salvar os dados de todas as Visitas
export const useVisitas = defineStore("visitas", {
  state: (): visitaState => ({
    data: {
      total: 0,
      data: null,
      page: 0,
      totalPages: 0,
    },
    page: 1,
    perPage: 100,
    isLoading: false,
    filterByStatus: "all",
    filterByName: null,
    filterByCity: "all",
  }),
  getters: {
    getStatusOptions(): StatusOption[] {
      return [
        { value: 1, label: "Pendente" },
        { value: 2, label: "Em Progresso" },
        { value: 3, label: "Reagendado" },
        { value: 4, label: "Cancelado" },
        { value: 5, label: "Concluído" },
      ];
    },
    getVisitaStatus(): Record<number, string> {
      return {
        1: "Pendente",
        2: "Em Progresso",
        3: "Reagendado",
        4: "Cancelado",
        5: "Concluído",
      };
    },
  },
  actions: {
    updateStatusFromState(id: number, statusInt: number) {
      if (!this.data.data) return;

      const visita = this.data.data.find((item) => item.id === id);
      if (visita) visita.statusInt = statusInt;
    },
    clearPage() {
      this.page = 1;
    },
    clearFilters() {
      this.page = 1;
      this.perPage = 100;
      this.filterByName = null;
      this.filterByStatus = "all";
      this.filterByCity = "all";
    },
    setFilterByName(value: string | null) {
      this.filterByName = value;
    },
    setFilterByStatus(value: number | string) {
      this.filterByStatus = value;
    },
    setFilterByCity(value: string) {
      this.filterByCity = value;
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
    buildQueryParams(): Record<string, any> {
      const queryParams: Record<string, any> = {
        page: this.page,
        perPage: this.perPage,
      };

      if (this.filterByStatus && this.filterByStatus !== "all")
        queryParams.status = this.filterByStatus;
      if (this.filterByName) queryParams.name = this.filterByName;
      if (this.filterByCity && this.filterByCity !== "all") queryParams.city = this.filterByCity;

      return queryParams;
    },
    async findAll() {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<visitaResponse>("/api/visitas", {
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
