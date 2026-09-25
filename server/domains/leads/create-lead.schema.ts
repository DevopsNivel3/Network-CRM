import { z } from "zod";

export const createLeadBodySchema = z.object({
  nome_lead: createStringSchema("Razão Social"),
  cpf_cnpj: z.string().nullable().optional(),
  contato_nome: z.string().nullable().optional(),
  contato: z.string().nullable().optional(),
  atividade: z.string().nullable().optional(),
  responsavel: z.string().nullable().optional(),
  num_funcionarios: z.number().nullable().optional(),
  faturamento: z.string().nullable().optional(),
  origem_lead: z.string().nullable().optional(),
  classificacao_oportunidade: z
    .enum(["frio", "morno", "quente"])
    .nullable()
    .optional(),
  grupo_ids: z.array(z.number()).optional(),
  localizacoes: z.array(
    z.object({
      key: z.number().nullable().optional(),
      rua: z.string().nullable().optional(),
      cidade: z.string().nullable().optional(),
      estado: z.string().nullable().optional(),
      complemento: z.string().nullable().optional(),
      numero: z.string().nullable().optional(),
      cep: z.string().nullable().optional(),
    }),
  ),
  observacoes: z.string().nullable().optional(),
  controle_lembretes: z.boolean().optional().default(true),
});

export type CreateLeadInput = z.infer<typeof createLeadBodySchema>;

export const normalizeCpfCnpj = (value?: string | null) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits || null;
};
