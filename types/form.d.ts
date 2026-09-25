declare enum TipoOportunidadeInteracao {
  MENSAGEM = 1,
  EMAIL = 2,
  TELEFONE = 3,
}

declare enum StatusOportunidadeInteracao {
  ENVIADA = 1,
  RESPONDIDA = 2,
  NÃO_ATENDIDA = 3,
  ATENDIDA = 4,
  OCUPADO = 5,
  IGNORADA = 6,
  NAO_RESPONDIDO = 7,
  RESPONDIDO = 8,
  ENVIADO = 9,
}

declare interface FormLeadCreateLocation {
  key: number;
  rua: string;
  cidade: string;
  estado: string;
  complemento?: string;
  numero: string;
  cep: string;
  id?: number;
}

declare interface FormLeadCreate {
  nome_lead: string | null;
  cpf_cnpj: string | null;
  responsavel: string | null;
  contato: string | null;
  contato_nome: string | null;
  atividade: string | null;
  faturamento: string | number | null;
  num_funcionarios: number;
  origem_lead: string | null;
  controle_lembretes?: boolean;
  classificacao_oportunidade?: "frio" | "morno" | "quente" | null;
  grupo_ids?: number[] | null;
  usuario?: { id: number | null; nome: string | null };
  localizacoes: FormLeadCreateLocation[] | null;
  observacoes: string | null;
  criado?: string | null;
  atualizado?: string | null;
}

declare interface FormLogin {
  email: string;
  senha: string;
}

declare interface FormChangePassword {
  senha: string | null;
  novaSenha: string | null;
  checkNovaSenha: string | null;
}

declare interface FormUsuarioPasswordReset {
  token: string | null;
  novaSenha: string | null;
  checkNovaSenha: string | null;
}

declare interface FormUsuarioCreate {
  nome: string | null;
  cpf?: string | null;
  contato: string | null;
  email: string | null;
  senha: string | null;
  desativado?: boolean | string;
  permissoes: number[] | null;
  avatar?: string | null;
  criado?: string | null;
  atualizado?: string | null;
  empresas?: number;
  image?: string | null;
}

declare interface FormOportunidadeCreate {
  tipo: string | null;
  descricao: string | null;
  board_id: number | string | undefined;
  valor_estimado: number | string | null;
  faixa_valor: string;
  num_pdvs: number;
  num_lojas: number;
  infraestrutura: string | null;
  observacoes: string | null;
  lead_id: number | null;
  controle_lembretes?: boolean;
  motivo?: string | null;
  motivo_observacao?: string | null;
}

declare interface FormVisitaCreate {
  data_inicio?: Date;
  hora_inicio?: string;
  data_fim?: string;
  statusInt?: string | null;
  motivo?: string | null;
  observacoes?: string | null;
  imagem_src?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  localizacao_id?: number | null;
  oportunidade_id?: number | null;
}

declare interface FormEmpresaCreate {
  nome: string | null;
  grupo?: string | null;
  contato: string | null;
  email: string | null;
  senha?: string | null;
  permissoes?: number[] | null;
  modulos?: string[] | null;
  desativado?: boolean | string;
}

declare type QualificacaoOportunidade =
  | "Prospecção"
  | "Frio"
  | "Morno"
  | "Quente"
  | "Fechado"
  | "Cancelado"
  | "Declinado";

declare interface FormBoardCreate {
  titulo: string | null;
  descricao: string | null;
  cor: string | null;
  posicao: number | null;
  qualificacao: QualificacaoOportunidade | null;
  usuario_atribuido_id?: number | null;
  controle_lembretes?: boolean;
  exige_motivo?: boolean;
  grupo_motivos?: string | null;
  motivos?: string[];
  exigir_obs_outro?: boolean;
}
