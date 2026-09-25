interface UsuarioData {
  id: number;
  email: string;
  cpf?: string | null;
  nome: string;
  contato: string;
  permissoes: number;
  avatar?: string | null;
  online?: boolean;
  desativado: boolean;
  criado: string;
  atualizado: string;
  _count?: {
    leads: number;
    oportunidades: number;
    visitas: number;
  };
  empresa?: {
    id?: number;
    nome?: string;
    desativado?: boolean;
    modulos?: string[] | null;
  };
}

interface UsuarioState {
  data: UsuarioData | null;
  isSubmitting: boolean;
  isLoading: boolean;
}

// Store para salvar os dados do Usuário
export const useUsuario = defineStore("usuario", {
  state: (): UsuarioState => ({
    data: null,
    isSubmitting: false,
    isLoading: false,
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
    async resetPassword(data: any): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>("/api/auth/resetar/senha", {
          method: "PATCH",
          body: data,
        });

        return res;
      } catch (err) {
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async sendPasswordResetEmail(email: string): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>("/api/auth/resetar/senha", {
          method: "POST",
          body: { email },
        });

        return res;
      } catch (err) {
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async validatePasswordResetToken(token: string): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const res = await useApi<boolean>(
          `/api/auth/resetar/senha?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          },
        );

        return res;
      } catch (err) {
        return false;
      } finally {
        this.setIsLoading(false);
      }
    },
    async updateById(id: number, data: any): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<UsuarioData>(`/api/usuarios/${id}`, {
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
    async create(data: any): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>("/api/usuarios", {
          method: "POST",
          body: data,
        });

        return res;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async findById(id: number | string): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const res = await useApi<UsuarioData>(`/api/usuarios/${id}`, {
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
    async findSelf(): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const res = await useApi<UsuarioData>("/api/usuarios/perfil", {
          method: "GET",
        });

        this.data = res;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data?.message);
        return false;
      } finally {
        this.setIsLoading(false);
      }
    },
    async updateProfile(data: any): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<UsuarioData>("/api/usuarios/perfil", {
          method: "PATCH",
          body: data,
        });

        this.data = res;
        return res !== null;
      } catch (err: any) {
        this.setError(err?.data?.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
    async changePassword(data: FormChangePassword): Promise<boolean> {
      this.setIsSubmitting(true);

      try {
        const res = await useApi<boolean>("/api/usuarios", {
          method: "PATCH",
          body: data,
        });

        return res;
      } catch (err: any) {
        this.setError(err?.data.message);
        return false;
      } finally {
        this.setIsSubmitting(false);
      }
    },
  },
});
