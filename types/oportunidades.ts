export interface BoardOpportunity {
  id: number;
  tipo: string;
  statusInt: number;
  board_id: number;
  motivo_atual?: {
    motivo: string;
    motivo_observacao: string | null;
    criado: string;
  } | null;
  posicao: number;
  criado: string;
  atualizado: string;
  descricao: string;
  desativado?: boolean;
  responsavel_atual?: { principal?: boolean; pode_editar?: boolean } | null;
  responsaveis: Array<{
    principal?: boolean;
    usuario: { id: number; nome: string; avatar: string | null };
  }>;
  _count?: { responsaveis: number };
  lead: {
    nome_lead: string;
    localizacoes: Array<{
      numero: string;
      rua: string;
      cidade: string;
      estado: string;
      complemento: string;
      cep: string;
    }>;
  };
}

export interface OpportunitiesResponse {
  total: number;
  data: BoardOpportunity[] | null;
  page: number;
  totalPages: number;
}

export interface BoardCardsResponse {
  boards: Array<{
    board_id: number;
    total: number;
    hasMore: boolean;
    items: BoardOpportunity[];
  }>;
  page: number;
  perBoard: number;
  hasMore: boolean;
  total?: number;
  boardId?: number;
}

export interface RealtimeOpportunity {
  id: number;
  tipo: string | null;
  descricao: string | null;
  statusInt: number | null;
  board_id: number | null;
  motivo_atual?: BoardOpportunity["motivo_atual"];
  posicao: number | null;
  criado: string;
  atualizado: string;
  desativado?: boolean;
  responsavel_atual?: BoardOpportunity["responsavel_atual"];
  responsaveis?: BoardOpportunity["responsaveis"];
  _count?: BoardOpportunity["_count"];
  lead?: BoardOpportunity["lead"];
}

export interface OpportunityBoard {
  id: number;
  titulo: string;
  descricao: string;
  cor: string;
  qualificacao: QualificacaoOportunidade;
  posicao: number;
  controle_lembretes?: boolean;
  exige_motivo?: boolean;
  grupo_motivos?: string | null;
  motivos?: string[];
  exigir_obs_outro?: boolean;
  usuario_atribuido_id?: number | null;
  usuario_atribuido?: {
    id: number;
    nome: string;
    avatar: string | null;
  } | null;
}

export interface OpportunitiesState {
  data: OpportunitiesResponse;
  boards: { data: OpportunityBoard[] | null; isLoading: boolean };
  boardTotals: Record<number, number>;
  boardPages: Record<number, number>;
  boardHasMore: Record<number, boolean>;
  boardLoadingMore: Record<number, boolean>;
  page: number;
  perPage: number;
  isSubmitting: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreBoards: boolean;
  filterByUserId: number | string;
  filterByName: string | null;
  filterByCity: string;
  filterByRange: string;
  filterByStatus: number | string;
  filterByGroupIds: number[];
  filterByBetweenDates: string[] | null;
  filterByInteractionDates: string[] | null;
  filterByDisabledMode: "without" | "with" | "only";
}

export interface OpportunityStatusOption {
  value: number;
  label: string;
}
export interface OpportunityListOption {
  label: string;
  value: number;
  tipo: string;
}
