interface LocalizacaoData {
  id: number;
  rua: string;
  cidade: string;
  estado: string;
  complemento?: string;
  numero: string;
  cep: string;
}

interface OportunidadeData {
  id: number;
  lead: {
    id: number;
    nome_lead: string;
  };
}

interface VisitaData {
  id: number;
  data_inicio: string;
  hora_inicio: string;
  motivo: string;
  data_fim: string;
  imagem_src: string;
  latitude: number;
  longitude: number;
  statusInt: number;
  criado: string;
  atualizado: string;
  oportunidade: OportunidadeData;
  localizacao: LocalizacaoData;
}

interface VisitaState {
  data: VisitaData | null;
  isLoading: boolean;
  isSubmitting: boolean;
}

// Store para salvar os dados da Visita
export const useVisita = defineStore("visita", {
  state: (): VisitaState => ({
    data: null,
    isLoading: false,
    isSubmitting: false,
  }),
  actions: {
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setIsSubmitting(value: boolean) {
      this.isSubmitting = value;
    },
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    async updateStatusById(visitaId: string | number, statusInt: number): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(`/api/visitas/${visitaId}/status`, {
          method: "PATCH",
          body: {
            statusInt,
          },
        });

        if (res) this.data!.statusInt = statusInt;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async updateById(id: string | number, data: any): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<VisitaData>(`/api/visitas/${id}`, {
          method: "PATCH",
          body: data,
        });

        this.data = res;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async create(data: any): Promise<VisitaData | null> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<VisitaData>(`/api/visitas`, {
          method: "POST",
          body: data,
        });

        return res;
      } catch (err: any) {
        this.setError(err?.data.message);
        return null;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async findById(id: string | number): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const res = await useApi<VisitaData>(`/api/visitas/${id}`, {
          method: "GET",
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
