import { z } from "zod";

export const updateLeadBodySchema = z.object({
  nome_lead: createStringSchema("Razão Social"),
  cpf_cnpj: z.string().nullable().optional(),
  contato_nome: z.string().nullable().optional(),
  contato: z.string().nullable().optional(),
  atividade: z.string().nullable().optional(),
  responsavel: z.string().nullable().optional(),
  num_funcionarios: z.number().nullable().optional(),
  faturamento: z.string().nullable().optional(),
  origem_lead: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  controle_lembretes: z.boolean().optional(),
  grupo_ids: z.array(z.number()).nullable().optional(),
  localizacoes: z
    .array(
      z.object({
        id: z.number().nullable().optional(),
        key: z.number().nullable().optional(),
        rua: z.string().nullable().optional(),
        cidade: z.string().nullable().optional(),
        estado: z.string().nullable().optional(),
        complemento: z.string().nullable().optional(),
        numero: z.string().nullable().optional(),
        cep: z.string().nullable().optional(),
      }),
    )
    .nullable()
    .optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadBodySchema>;
