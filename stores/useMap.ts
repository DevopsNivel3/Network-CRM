interface EstadoData {
  id: number;
  value: string;
  label: string;
  uf?: string;
}

interface CidadeData {
  id: number;
  value: string;
  label: string;
}

interface MapState {
  data: EstadoData[] | null;
  isLoading: boolean;
}

// Store para salvar os dados do Mapa, além dos estados
export const useMap = defineStore("map", {
  state: (): MapState => ({
    data: null,
    isLoading: false,
  }),

  actions: {
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    async findEstados(): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const res = await useApi<EstadoData[]>("/api/map/estados", {
          method: "GET",
          key: "estados",
        });

        this.data = res;
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      }
    },
    async findCidadesByEstado(estado: string): Promise<CidadeData[] | null> {
      this.setIsLoading(true);

      try {
        const res = await useApi<CidadeData[]>(`/api/map/cidades?estado=${estado}`, {
          method: "GET",
          key: `cidades-${estado}`,
        });

        this.setIsLoading(false);
        return res;
      } catch (err: any) {
        this.setError(err?.data.message);
        return null;
      }
    },
  },
});
