export interface ReminderItem {
  lead_id: number;
  lead_nome: string;
  contato_nome: string | null;
  contato: string | null;
  cidade: string | null;
  estado: string | null;
  usuario: {
    id: number;
    nome: string;
  };
  dias_sem_interacao: number;
  proximo_intervalo_dias: number | null;
  prazo_em: string;
  dias_em_atraso: number;
  followup_personalizado: boolean;
  nivel_urgencia: "critico" | "alto" | "medio" | "baixo" | "planejado";
  ultima_interacao: {
    tipo: string;
    criado: string;
  };
}

interface ReminderResponse {
  intervalos: number[];
  data: ReminderItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface ReminderConfigResponse {
  intervalos: number[];
  atualizado: string | null;
}

interface ReminderState {
  data: ReminderItem[];
  intervalos: number[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  isLoading: boolean;
  isSavingConfig: boolean;
  error: string | null;
  updatedAt: string | null;
}

export const useReminders = defineStore("reminders", {
  state: (): ReminderState => ({
    data: [],
    intervalos: [],
    total: 0,
    page: 1,
    perPage: 20,
    totalPages: 0,
    isLoading: false,
    isSavingConfig: false,
    error: null,
    updatedAt: null,
  }),
  actions: {
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setError(value: string | null) {
      this.error = value;
    },
    setIsSavingConfig(value: boolean) {
      this.isSavingConfig = value;
    },
    async handlePageChange(newPage: number) {
      this.page = newPage;
      await this.fetchReminders();
    },
    async fetchConfig(): Promise<boolean> {
      this.setIsLoading(true);
      this.setError(null);

      try {
        const response = await useApi<ReminderConfigResponse>("/api/leads/reminders/config", {
          method: "GET",
        });

        this.intervalos = response.intervalos;
        this.updatedAt = response.atualizado;
        this.setIsLoading(false);
        return true;
      } catch (err: any) {
        this.setError(err.data?.message || "Erro ao carregar configuração dos lembretes");
        this.setIsLoading(false);
        return false;
      }
    },
    async updateConfig(intervalos: number[]): Promise<boolean> {
      this.setIsSavingConfig(true);
      this.setError(null);

      try {
        const response = await useApi<ReminderConfigResponse>("/api/leads/reminders/config", {
          method: "PATCH",
          body: { intervalos },
        });

        this.intervalos = response.intervalos;
        this.updatedAt = response.atualizado;
        this.setIsSavingConfig(false);
        return true;
      } catch (err: any) {
        this.setError(err.data?.message || "Erro ao salvar configuração dos lembretes");
        this.setIsSavingConfig(false);
        return false;
      }
    },
    async fetchReminders(): Promise<boolean> {
      this.setIsLoading(true);
      this.setError(null);

      try {
        const response = await useApi<ReminderResponse>("/api/leads/reminders", {
          method: "GET",
          query: {
            page: this.page,
            perPage: this.perPage,
          },
        });

        this.data = response.data;
        this.intervalos = response.intervalos;
        this.total = response.total;
        this.page = response.page;
        this.totalPages = response.totalPages;
        this.setIsLoading(false);
        return true;
      } catch (err: any) {
        this.setError(err.data?.message || "Erro ao carregar lembretes");
        this.setIsLoading(false);
        return false;
      }
    },
  },
});

