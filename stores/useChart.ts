import dayjs from "dayjs";

interface OportunidadeChartData {
  funil:
    | {
        value: number;
        name: string;
      }[]
    | null;
  valor_estimado: number | null;
  insights: {
    stuck_leads:
      | {
          id: number;
          lead_id: number;
          lead_name: string | null;
          lead_contact: string | null;
          board_id: number;
          board_name: string;
          board_cor: string;
          days_stuck: number;
          created_at: Date;
          updated_at: Date;
        }[]
      | null;
    total_stuck: number | null;
    origem_lead:
      | {
          name: string;
          value: number;
        }[]
      | null;
  } | null;
  interacoesPorUsuario: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
  } | null;
  interacoesPorTipo:
    | {
        value: number;
        name: number;
      }[]
    | null;
  interacoesPorData: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
  } | null;
}

interface ChartData {
  oportunidades: OportunidadeChartData | null;
}

interface OportunidadeState {
  data: ChartData | null;
  isLoading: boolean;
  filterByUserId: number | string;
  filterByCity: string;
  filterByStatus: number | string;
  filterByGroupIds: number[];
  filterByBetweenDates: string[] | null;
}

// Store para salvar os dados dos charts
export const useChart = defineStore("chart", {
  state: (): OportunidadeState => ({
    data: {
      oportunidades: {
        funil: [],
        valor_estimado: null,
        insights: {
          stuck_leads: [],
          total_stuck: null,
          origem_lead: [],
        },
        interacoesPorData: {
          categories: [],
          series: [],
        },
        interacoesPorUsuario: {
          categories: [],
          series: [],
        },
        interacoesPorTipo: [],
      },
    },
    isLoading: false,
    filterByUserId: "all",
    filterByStatus: "all",
    filterByGroupIds: [],
    filterByCity: "all",
    filterByBetweenDates: [
      dayjs().startOf("month").subtract(2, "month").format("YYYY-MM-DD"),
      dayjs().endOf("month").format("YYYY-MM-DD"),
    ],
  }),
  actions: {
    clearFilters() {
      this.filterByUserId = "all";
      this.filterByCity = "all";
      this.filterByStatus = "all";
      this.filterByGroupIds = [];
      this.filterByBetweenDates = [
        dayjs().startOf("month").subtract(2, "month").format("YYYY-MM-DD"),
        dayjs().endOf("month").format("YYYY-MM-DD"),
      ];
    },
    setFilterByBetweenDates(value: string[] | null) {
      this.filterByBetweenDates = value;
    },
    setFilterByStatus(value: number | string) {
      this.filterByStatus = value;
    },
    setFilterByCity(value: string) {
      this.filterByCity = value;
    },
    setFilterByUserId(value: number | string) {
      this.filterByUserId = value;
    },
    setFilterByGroupIds(value: number[] | null) {
      this.filterByGroupIds = value || [];
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
      if (this.filterByCity && this.filterByCity !== "all")
        queryParams.city = this.filterByCity;
      if (this.filterByStatus && this.filterByStatus !== "all")
        queryParams.status = this.filterByStatus;
      if (this.filterByBetweenDates && this.filterByBetweenDates.length > 0) {
        queryParams.startDate = this.filterByBetweenDates[0];
        queryParams.endDate = this.filterByBetweenDates[1];
      }
      if (this.filterByGroupIds && this.filterByGroupIds.length > 0) {
        queryParams.groupIds = this.filterByGroupIds.join(",");
      }

      return queryParams;
    },
    async oportunidadesChartFunil() {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<OportunidadeChartData>(
          "/api/chart/oportunidades/funil",
          {
            method: "GET",
            query: queryParams,
          },
        );

        this.data!.oportunidades!.funil = res?.funil || [];
        this.data!.oportunidades!.insights = res?.insights || {
          stuck_leads: [],
          total_stuck: null,
          origem_lead: [],
        };
        this.data!.oportunidades!.valor_estimado = res?.valor_estimado || null;
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      }
    },
    async oportunidadesChartInteracoes() {
      this.setIsLoading(true);

      try {
        const queryParams = this.buildQueryParams();
        const res = await useApi<OportunidadeChartData>(
          "/api/chart/oportunidades/interacoes",
          {
            method: "GET",
            query: queryParams,
          },
        );

        this.data!.oportunidades!.interacoesPorUsuario =
          res?.interacoesPorUsuario || {
            categories: [],
            series: [],
          };
        this.data!.oportunidades!.interacoesPorTipo =
          res?.interacoesPorTipo || [];
        this.data!.oportunidades!.interacoesPorData =
          res?.interacoesPorData || {
            categories: [],
            series: [],
          };
        this.setIsLoading(false);
        return res !== null;
      } catch (err: any) {
        this.setError(err.data?.message);
        return false;
      }
    },
  },
});
