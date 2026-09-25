import type { NuxtConfig } from "nuxt/schema";

// Configuração do Echarts
const echartsConfig: NuxtConfig["echarts"] = {
  charts: ["BarChart", "FunnelChart", "PieChart", "LineChart"],
  components: [
    "DatasetComponent",
    "GridComponent",
    "TooltipComponent",
    "ToolboxComponent",
    "LegendComponent",
  ],
};

export default echartsConfig;
