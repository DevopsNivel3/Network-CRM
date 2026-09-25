import dayjs from "dayjs";

interface StatsData {
  motivosMovimentacao?: {
    boardId: number;
    boardTitulo: string;
    grupo: string | null;
    items: {
      name: string;
      value: number;
      details: {
        oportunidadeId: number;
        leadNome: string;
        descricao: string | null;
        observacao: string | null;
        data: string;
      }[];
    }[];
  }[];
  total: {
    value: number;
    averagePerMonth: number;
    averagePerDay: number;
  };
  leadsByState?: {
    name: string;
    value: number;
  }[];
  leadsByDay?: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
  };
  pipelineValueByDay?: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
  };
  period?: {
    start: string;
    end: string;
    totalLeads: number;
    totalOportunidades: number;
    pipelineValue: number;
    totalInteracoes: number;
    oportunidadesComInteracao: number;
    coberturaOportunidadesPercent: number;
    averageLeadsPerDay: number;
    averageOportunidadesPerDay: number;
    conversionRate: number;
    leadsPercentageChange: string;
    oportunidadesPercentageChange: string;
    pipelinePercentageChange: string;
    conversionPercentageChange: string;
  };
  interacoes?: {
    total: number;
    byTipo: {
      name: string;
      value: number;
    }[];
    byStatus: {
      name: string;
      value: number;
    }[];
    detalhamentoPorTipo: {
      mensagem: {
        name: string;
        value: number;
      }[];
      email: {
        name: string;
        value: number;
      }[];
      telefone: {
        name: string;
        value: number;
      }[];
    };
    byResponsavel: {
      name: string;
      value: number;
    }[];
    byDia: {
      categories: string[];
      series: {
        name: string;
        data: number[];
      }[];
    };
    byTipoOverTime: {
      categories: string[];
      series: {
        name: string;
        data: number[];
      }[];
    };
    coberturaOportunidadesByBoard: {
      name: string;
      value: number;
    }[];
    lista: {
      id: number;
      tipo: string;
      data: string;
      conteudo: string | null;
      oportunidade_id: number;
      usuario: {
        nome: string;
        avatar: string | null;
      };
      lead: {
        nome_lead: string | null;
        contato_nome: string | null;
      };
      oportunidade: {
        status: string | null;
      };
    }[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
  year: {
    number: string;
    total: number;
    previousTotal: number;
    percentageChange: string;
    months: any;
  };
  month: {
    number: string;
    total: number;
    previousTotal: number;
    percentageChange: string;
  };
  day: {
    number: string;
    total: number;
    previousTotal: number;
    percentageChange: string;
  };
}

interface StatsState {
  data: StatsData | null;
  isLoading: boolean;
  filterByUserId: string | number;
  filterByYear: string;
  filterByBoardId: string | number;
  filterByOpportunityId: string | number;
  appliedBoardId: string | number;
  appliedOpportunityId: string | number;
  filterByBetweenDates: string[] | null;
  filterByInteractionDates: string[] | null;
  interactionPage: number;
  interactionPerPage: number;
  isInteractionLoadingMore: boolean;
  filterVersion: number;
}

// Store para salvar os dados dos Status
export const useStats = defineStore("stats", {
  state: (): StatsState => ({
    data: null,
    isLoading: false,
    filterByUserId: "all",
    filterByYear: dayjs().year().toString(),
    filterByBoardId: "all",
    filterByOpportunityId: "all",
    appliedBoardId: "all",
    appliedOpportunityId: "all",
    filterByBetweenDates: [
      dayjs().startOf("month").format("YYYY-MM-DD"),
      dayjs().endOf("month").format("YYYY-MM-DD"),
    ],
    filterByInteractionDates: null,
    interactionPage: 1,
    interactionPerPage: 25,
    isInteractionLoadingMore: false,
    filterVersion: 0,
  }),

  actions: {
    clearFilters() {
      this.filterByYear = dayjs().year().toString();
      this.filterByUserId = "all";
      this.filterByBoardId = "all";
      this.filterByOpportunityId = "all";
      this.filterByBetweenDates = [
        dayjs().startOf("month").format("YYYY-MM-DD"),
        dayjs().endOf("month").format("YYYY-MM-DD"),
      ];
      this.filterByInteractionDates = null;
      this.interactionPage = 1;
    },
    setFilterByUserId(value: string | number) {
      this.filterByUserId = value;
      this.interactionPage = 1;
    },
    setFilterByYear(value: string) {
      this.filterByYear = value;
      this.interactionPage = 1;
    },
    setFilterByBetweenDates(value: string[] | null) {
      this.filterByBetweenDates = value;
      this.interactionPage = 1;
    },
    setFilterByInteractionDates(value: string[] | null) {
      this.filterByInteractionDates = value;
      this.interactionPage = 1;
    },
    setFilterByBoardId(value: string | number) {
      this.filterByBoardId = value;
      this.interactionPage = 1;
    },
    setFilterByOpportunityId(value: string | number) {
      this.filterByOpportunityId = value;
      this.interactionPage = 1;
    },
    setInteractionPage(value: number) {
      this.interactionPage = value;
    },
    setInteractionPerPage(value: number) {
      this.interactionPerPage = value;
      this.interactionPage = 1;
    },
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setError(value: string | null) {
      useErr().setMessage(value);
    },
    buildQueryParams(): Record<string, any> {
      const queryParams: Record<string, any> = {};

      if (this.filterByUserId && this.filterByUserId !== "all")
        queryParams.userId = this.filterByUserId;
      if (this.filterByYear) queryParams.year = this.filterByYear;
      if (this.filterByBoardId && this.filterByBoardId !== "all")
        queryParams.boardId = this.filterByBoardId;
      if (this.filterByOpportunityId && this.filterByOpportunityId !== "all")
        queryParams.opportunityId = this.filterByOpportunityId;
      if (this.filterByBetweenDates && this.filterByBetweenDates.length === 2) {
        queryParams.startDate = this.filterByBetweenDates[0];
        queryParams.endDate = this.filterByBetweenDates[1];
      }
      if (this.filterByInteractionDates && this.filterByInteractionDates.length === 2) {
        queryParams.interactionStartDate = this.filterByInteractionDates[0];
        queryParams.interactionEndDate = this.filterByInteractionDates[1];
      }
      queryParams.interactionPage = this.interactionPage;
      queryParams.interactionPerPage = this.interactionPerPage;

      return queryParams;
    },
    async findAll(): Promise<boolean> {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<StatsData>("/api/stats", {
          method: "GET",
          query: queryParams,
        });

        this.data = res;
        this.interactionPage = res.interacoes?.pagination.page || 1;
        this.appliedBoardId = this.filterByBoardId;
        this.appliedOpportunityId = this.filterByOpportunityId;
        this.filterVersion += 1;
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        this.setIsLoading(false);
        return false;
      }
    },
    async loadMoreInteractions(): Promise<boolean> {
      const pagination = this.data?.interacoes?.pagination;
      if (
        !pagination ||
        pagination.page >= pagination.totalPages ||
        this.isInteractionLoadingMore
      ) {
        return false;
      }

      this.isInteractionLoadingMore = true;
      try {
        const nextPage = pagination.page + 1;
        const response = await useApi<StatsData>("/api/stats", {
          method: "GET",
          query: {
            ...this.buildQueryParams(),
            interactionPage: nextPage,
          },
        });

        if (!this.data?.interacoes || !response.interacoes) return false;

        this.data.interacoes.lista.push(...response.interacoes.lista);
        this.data.interacoes.pagination = response.interacoes.pagination;
        this.interactionPage = response.interacoes.pagination.page;
        return true;
      } catch (err: any) {
        this.setError(err.data?.message || "Erro ao carregar mais interacoes");
        return false;
      } finally {
        this.isInteractionLoadingMore = false;
      }
    },
  },
});
