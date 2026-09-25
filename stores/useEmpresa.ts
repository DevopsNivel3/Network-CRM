interface EmpresaData {
  id: number;
  nome: string;
  grupo?: string | null;
  contato: string;
  email: string;
  desativado: boolean;
  usuario_id: number;
  criado: string;
  atualizado: string;
  modulos?: string[] | null;
  _count?: {
    leads: number;
    usuarios: number;
  };
}

interface EmpresaState {
  data: EmpresaData | null;
  isLoading: boolean;
  isSubmitting: boolean;
}

// Store para salvar os dados da Empresa
export const useEmpresa = defineStore("empresa", {
  state: (): EmpresaState => ({
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
    async deleteById(id: number): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>(`/api/empresas/${id}`, {
          method: "DELETE",
        });

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async updateById(id: number, data: any): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<EmpresaData>(`/api/empresas/${id}`, {
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
    async create(data: FormEmpresaCreate): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>("/api/empresas", {
          method: "POST",
          body: data,
        });

        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async findById(id: string | number): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const res = await useApi<EmpresaData>(`/api/empresas/${id}`, {
          method: "GET",
        });

        this.data = res;
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      }
    },
  },
});
