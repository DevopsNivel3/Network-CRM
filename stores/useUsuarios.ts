interface UsuarioData {
  id: number;
  nome: string;
  desativado: boolean;
  avatar: string | null;
  online?: boolean;
  offline_segundos_30d?: number | null;
  sem_atividade_30_dias?: boolean;
  empresa?: {
    desativado?: boolean;
  };
}

interface UsuariosResponse {
  total: number;
  data: UsuarioData[] | null;
  page: number;
  totalPages: number;
}

interface UsuariosState {
  data: UsuariosResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  filterByStatus: string;
  filterByName: string | null;
}

interface UsuariosList {
  value: number;
  label: string;
}

// Store para salvar os dados de todos os Usuários
export const useUsuarios = defineStore("usuarios", {
  state: (): UsuariosState => ({
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
  }),
  getters: {
    formattedOptions(state): UsuariosList[] {
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

      const usuario = this.data.data.find((item) => item.id === id);
      if (usuario) usuario.desativado = desativado;
    },
    clearPage() {
      this.page = 1;
    },
    clearFilters() {
      this.page = 1;
      this.perPage = 100;
      this.filterByStatus = "all";
      this.filterByName = null;
    },
    setFilterByStatus(value: string) {
      this.filterByStatus = value;
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

      if (this.filterByStatus !== "all")
        queryParams.status = this.filterByStatus;
      if (this.filterByName) queryParams.name = this.filterByName;

      return queryParams;
    },
    async findAll(): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<UsuariosResponse>("/api/usuarios", {
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
