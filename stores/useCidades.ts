interface CidadeData {
  id: number;
  nome: string;
  estado: {
    nome: string;
  };
}

interface CidadeResponse {
  total: number;
  data: CidadeData[] | null;
  page: number;
  totalPages: number;
}

interface CidadeState {
  data: CidadeResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  filterByName: string | null;
  filterByEstado: string;
}

interface CidadeList {
  value: number | string;
  label: string;
  estado_nome: string;
}

// Store para salvar os dados de todas as cidades
export const useCidades = defineStore("cidades", {
  state: (): CidadeState => ({
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
    filterByEstado: "all",
  }),
  getters: {
    formattedOptions(state): CidadeList[] {
      return state.data.data
        ? state.data.data.map((item) => ({
            value: item.nome,
            label: item.nome,
            estado_nome: item?.estado?.nome,
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
    setFilterByEstado(value: string) {
      this.filterByEstado = value;
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

      if (this.filterByEstado !== "all") queryParams.estado = this.filterByEstado;
      if (this.filterByName) queryParams.name = this.filterByName;

      return queryParams;
    },
    async findAll() {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<CidadeResponse>("/api/cidades", {
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
