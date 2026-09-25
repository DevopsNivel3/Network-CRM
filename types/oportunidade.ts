export interface LocalizacaoData {
  id: number;
  rua: string;
  cidade: string;
  estado: string;
  complemento?: string;
  numero: string;
  cep: string;
}

export interface LeadData {
  id: number;
  nome_lead: string;
  contato_nome: string;
  contato: string;
  localizacoes: LocalizacaoData[];
  grupos: GrupoData[];
}

export interface ResponsavelData {
  usuario: {
    id: number;
    nome: string;
    avatar: string;
  };
  criado?: string;
  principal?: boolean;
  gerencia_responsaveis?: boolean;
  pode_editar?: boolean;
  pode_interacoes?: boolean;
  pode_visitas?: boolean;
}

export interface UsuarioData {
  id: number;
  nome: string;
  avatar: string;
}

export interface VisitaData {
  id: number;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  statusInt: number;
}

export interface ComentarioData {
  id: number;
  descricao: string;
  usuario: UsuarioData;
  criado: string;
  atualizado: string;
  anexos?: {
    id: number;
    nome: string;
    url: string;
    tipo?: string | null;
    tamanho?: number | null;
    usuario_id?: number | null;
  }[];
}

export interface GrupoData {
  id: number;
  nome: string;
}

export interface OportunidadeData {
  id: number;
  tipo: string;
  descricao: string;
  statusInt: number;
  board_id: number;
  desativado?: boolean;
  valor_estimado: number;
  faixa_valor: string;
  infraestrutura: string;
  num_pdvs: number;
  num_lojas: number;
  observacoes: string;
  controle_lembretes: boolean;
  usuario: UsuarioData;
  lead: LeadData;
  visitas?: VisitaData[];
  comentarios: ComentarioData[];
  responsaveis: ResponsavelData[];
  responsavel_atual?: {
    principal?: boolean;
    gerencia_responsaveis?: boolean;
    pode_editar: boolean;
    pode_interacoes: boolean;
    pode_visitas: boolean;
  } | null;
  _count: {
    responsaveis: number;
  };
  criado: string;
  atualizado: string;
}

export interface OportunidadeCreateResponse {
  id: number;
  lead_id: number;
  tipo: string | null;
  descricao: string | null;
  statusInt: number | null;
  board_id: number | null;
  desativado: boolean;
  criado: string;
  atualizado: string;
  usuario: UsuarioData;
}

export interface InteracaoData {
  id: number;
  tipo: TipoOportunidadeInteracao;
  conteudo: string;
  status: StatusOportunidadeInteracao;
  statusInt: number;
  data: string;
  usuario: UsuarioData;
  anexos?: {
    id: number;
    nome: string;
    url: string;
    tipo?: string | null;
    tamanho?: number | null;
    usuario_id?: number | null;
  }[];
}

export interface InteracaoResponse {
  total: number;
  data: InteracaoData[] | null;
  page: number;
  totalPages: number;
}

export interface OportunidadeCommentsResponse {
  total: number;
  data: ComentarioData[] | null;
  page: number;
  totalPages: number;
}

export interface OportunidadeState {
  data: OportunidadeData | null;
  visitas: {
    data: VisitaData[];
    isLoading: boolean;
  };
  responsaveis: {
    data: {
      total: number;
      data: ResponsavelData[] | null;
    };
    isLoading: boolean;
  };
  interacoes: {
    data: {
      total: number;
      data: InteracaoData[] | null;
      page: number;
      totalPages: number;
    };
    page: number;
    perPage: number;
    isLoading: boolean;
  };
  comments: {
    data: OportunidadeCommentsResponse;
    page: number;
    perPage: number;
    isLoading: boolean;
  };
  isLoading: boolean;
  isSubmitting: boolean;
}
