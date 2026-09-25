interface LeadInteractionItem {
  id: number;
  tipo: "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "QUOTATION" | "NOTE";
  descricao: string | null;
  origem: string | null;
  criado: string;
  usuario: {
    id: number;
    nome: string;
  } | null;
}

interface LeadInteractionResponse {
  data: LeadInteractionItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface LeadInteractionPayload {
  tipo: LeadInteractionItem["tipo"];
  descricao?: string | null;
  origem?: string | null;
}

interface LeadInteractionState {
  data: LeadInteractionItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export const useLeadInteractions = defineStore("lead-interactions", {
  state: (): LeadInteractionState => ({
    data: [],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),
  actions: {
    setError(value: string | null) {
      this.error = value;
    },
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setIsSubmitting(value: boolean) {
      this.isSubmitting = value;
    },
    async handlePageChange(newPage: number, leadId: number) {
      this.page = newPage;
      await this.fetchInteractions(leadId);
    },
    async fetchInteractions(leadId: number): Promise<boolean> {
      this.setIsLoading(true);
      this.setError(null);

      try {
        const response = await useApi<LeadInteractionResponse>(`/api/leads/${leadId}/interactions`, {
          method: "GET",
          query: {
            page: this.page,
            perPage: this.perPage,
          },
        });

        this.data = response.data;
        this.total = response.total;
        this.page = response.page;
        this.totalPages = response.totalPages;
        this.setIsLoading(false);
        return true;
      } catch (err: any) {
        this.setError(err.data?.message || "Erro ao carregar interações");
        this.setIsLoading(false);
        return false;
      }
    },
    async createInteraction(leadId: number, payload: LeadInteractionPayload): Promise<boolean> {
      this.setIsSubmitting(true);
      this.setError(null);

      try {
        const response = await useApi<boolean>(`/api/leads/${leadId}/interactions`, {
          method: "POST",
          body: payload,
        });

        this.setIsSubmitting(false);
        return response !== null;
      } catch (err: any) {
        this.setError(err.data?.message || "Erro ao registrar interação");
        this.setIsSubmitting(false);
        return false;
      }
    },
    reset() {
      this.data = [];
      this.total = 0;
      this.page = 1;
      this.totalPages = 0;
      this.error = null;
      this.isLoading = false;
      this.isSubmitting = false;
    },
  },
});
