interface IntegracaoData {
  id: number;
  tipo: string;
  enabled: boolean;
  config?: Record<string, any> | null;
  criado?: string;
  atualizado?: string;
}

interface IntegracoesResponse {
  total: number;
  data: IntegracaoData[] | null;
  page: number;
  totalPages: number;
}

interface IntegracoesState {
  data: IntegracoesResponse;
  page: number;
  perPage: number;
  isLoading: boolean;
  isSubmitting: boolean;
}

export const useIntegracoes = defineStore("integracoes", {
  state: (): IntegracoesState => ({
    data: {
      total: 0,
      data: null,
      page: 1,
      totalPages: 1,
    },
    page: 1,
    perPage: 100,
    isLoading: false,
    isSubmitting: false,
  }),
  actions: {
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setIsSubmitting(value: boolean) {
      this.isSubmitting = value;
    },
    setFromResponse(integration: IntegracaoData) {
      const current = this.data.data || [];
      const index = current.findIndex((item) => item.id === integration.id);
      if (index >= 0) current[index] = integration;
      else current.unshift(integration);
      this.data.data = [...current];
      this.data.total = this.data.data.length;
    },
    removeFromState(id: number) {
      if (!this.data.data) return;
      this.data.data = this.data.data.filter((item) => item.id !== id);
      this.data.total = this.data.data.length;
    },
    async findAll() {
      this.setIsLoading(true);
      try {
        const res = await useApi<IntegracoesResponse>("/api/integracoes", {
          method: "GET",
          query: { page: this.page, perPage: this.perPage },
        });
        if (res) this.data = res;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data?.message);
        return false;
      } finally {
        this.setIsLoading(false);
      }
    },
    async findById(id: number) {
      try {
        const res = await useApi<IntegracaoData>(`/api/integracoes/${id}`, {
          method: "GET",
        });
        if (res) this.setFromResponse(res);
        return res;
      } catch (err: any) {
        this.setError(err?.data?.message);
        return null;
      }
    },
    async upsert(tipo: string, enabled: boolean, config?: Record<string, any>) {
      this.setIsSubmitting(true);
      try {
        const res = await useApi<IntegracaoData>("/api/integracoes", {
          method: "POST",
          body: { tipo, enabled, config },
        });
        if (res) this.setFromResponse(res);
        return res;
      } catch (err: any) {
        this.setError(err?.data?.message);
        return null;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async update(id: number, enabled: boolean, config?: Record<string, any>) {
      this.setIsSubmitting(true);
      try {
        const res = await useApi<IntegracaoData>(`/api/integracoes/${id}`, {
          method: "POST",
          body: { enabled, config },
        });
        if (res) this.setFromResponse(res);
        return res;
      } catch (err: any) {
        this.setError(err?.data?.message);
        return null;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async remove(id: number) {
      this.setIsSubmitting(true);
      try {
        const res = await useApi<boolean>(`/api/integracoes/${id}`, {
          method: "DELETE",
        });
        if (res) this.removeFromState(id);
        return res;
      } catch (err: any) {
        this.setError(err?.data?.message);
        return null;
      } finally {
        this.setIsSubmitting(false);
      }
    },
  },
});
