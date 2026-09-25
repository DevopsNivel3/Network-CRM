interface LeadDuplicateErrorPayload {
  code: "LEAD_CNPJ_DUPLICATE";
  title?: string;
  message: string;
  recommendation?: string;
  lead?: {
    id: number;
    nome?: string | null;
    cpf_cnpj?: string | null;
    comentarios?: number;
    oportunidades?: number;
  };
  owner?: {
    id: number;
    nome: string;
    email?: string | null;
  } | null;
}

type ErrMessage = string | LeadDuplicateErrorPayload;

interface ErrState {
  message: ErrMessage | null;
}

// Store para salvar o erro que vem do backend
export const useErr = defineStore("err", {
  state: (): ErrState => ({
    message: null,
  }),
  actions: {
    setMessage(value: ErrMessage | null) {
      this.message = value;
    },
  },
});
