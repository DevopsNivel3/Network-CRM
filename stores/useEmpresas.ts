interface EmpresaData {
  id: number;
  nome: string;
  desativado: boolean;
}

interface EmpresasResponse {
  total: number;
  data: EmpresaData[] | null;
  page: number;
  totalPages: number;
}

interface EmpresasState {
  data: EmpresasResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  filterByName: string | null;
}

interface EmpresasList {
  value: number;
  label: string;
}

// Store para salvar os dados de todas as Empresas
export const useEmpresas = defineStore("empresas", {
  state: (): EmpresasState => ({
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
    formattedOptions(state): EmpresasList[] {
      return state.data.data
        ? state.data.data.map((item) => ({
            value: item.id,
            label: item.nome,
          }))
        : [];
    },
  },
  actions: {
    updateStatusFromState(id: number, desativado: boolean) {
      if (!this.data.data) return;

      const empresa = this.data.data.find((item) => item.id === id);
      if (empresa) empresa.desativado = desativado;
    },
    clearPage() {
      this.page = 1;
    },
    clearFilters() {
      this.page = 1;
      this.perPage = 100;
      this.filterByName = null;
    },
    setFilterByName(value: string | null) {
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
        const res = await useApi<EmpresasResponse>("/api/empresas", {
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
