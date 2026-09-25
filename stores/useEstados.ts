interface EstadoData {
  id: number;
  nome: string;
}

interface EstadoResponse {
  total: number;
  data: EstadoData[] | null;
  page: number;
  totalPages: number;
}

interface EstadoState {
  data: EstadoResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  filterByName: string | null;
}

interface EstadoList {
  value: number | string;
  label: string;
}

// Store para salvar os dados de todas as estados
export const useEstados = defineStore("estados", {
  state: (): EstadoState => ({
    data: {
      total: 0,
      data: null,
      page: 0,
      totalPages: 0,
    },
    page: 1,
    perPage: 100,
    isLoading: false,
    filterByName: null,
  }),
  getters: {
    formattedOptions(state): EstadoList[] {
      return state.data.data
        ? state.data.data.map((item) => ({
            value: item.nome,
            label: item.nome,
          }))
        : [];
    },
  },
  actions: {
    clearPage() {
      this.page = 1;
    },
    clearFilters() {
      this.page = 1;
      this.perPage = 100;
      this.filterByName = null;
    },
    setFilterByName(value: string) {
      this.filterByName = value;
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

      if (this.filterByName) queryParams.name = this.filterByName;

      return queryParams;
    },
    async findAll() {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<EstadoResponse>("/api/estados", {
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
