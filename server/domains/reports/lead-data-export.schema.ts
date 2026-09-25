import { z } from "zod";

export const leadDataExportSchema = z.object({
  export_type: z.enum(["csv", "xlsx", "json"]),
  userId: z.union([z.string(), z.number()]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  dateBetween: z.array(z.string()).length(2),
  dateField: z.enum(["criado", "atualizado"]).default("criado"),
  dateEntity: z.enum(["lead", "oportunidade", "interacao"]).default("lead"),
  options: z.object({
    leads: z.array(
      z.enum([
        "ID",
        "LEAD_NOME",
        "CPF/CNPJ",
        "RESPONSAVEL",
        "CONTATO_NOME",
        "CONTATO_TELEFONE",
        "ATIVIDADE",
        "FATURAMENTO",
        "NUM_FUNCIONARIOS",
        "OBSERVACOES",
        "USUARIO_ID",
        "USUARIO_NOME",
        "CRIADO",
        "ATUALIZADO",
      ]),
    ),
    oportunidades: z.array(
      z.enum([
        "ID",
        "VALOR_ESTIMADO",
        "FAIXA_VALOR",
        "DESCRICAO",
        "BOARD_ID",
        "BOARD_NOME",
        "USUARIO_ID",
        "USUARIO_NOME",
        "CRIADO",
        "ATUALIZADO",
      ]),
    ),
    localizacoes: z.array(
      z.enum([
        "ID",
        "RUA",
        "NUMERO",
        "CIDADE",
        "COMPLEMENTO",
        "ESTADO",
        "CEP",
        "CRIADO",
        "ATUALIZADO",
      ]),
    ),
    interacoes: z
      .array(
        z.enum([
          "ID",
          "USUARIO_ID",
          "USUARIO_NOME",
          "STATUS",
          "TIPO",
          "CONTEUDO",
          "DATA",
        ]),
      )
      .default([]),
  }),
});

export type LeadDataExportInput = z.infer<typeof leadDataExportSchema>;
