<script setup lang="ts">
import { APP_FONT_FAMILY } from "~/utils/design";

const props = defineProps<{
    width?: string;
    height?: string;
    data?: {
        name: number | string;
        value: number;
    }[];
    seriesData?: {
        categories: string[];
        series: {
            name: string;
            data: number[];
        }[];
    };
    labels?: string[];
    horizontal?: boolean; // Prop para controlar a orientação
    seriesName?: string;
    gridLeft?: string;
    yAxisLabelWidth?: number;
}>();

const { isDark } = useTheme();
const vchartRef = ref();

defineExpose({
    getDataURL: (opts?: any) => vchartRef.value?.getDataURL?.(opts),
});

const labels = computed(() => {
    if (props.seriesData) {
        return props.seriesData.categories;
    }
    return props.labels || props.data?.map((d) => d.name) || [];
});

const values = computed(() => props.data?.map((d) => d.value) || []);

const predefinedColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#F97316",
    "#84CC16",
    "#EC4899",
    "#6B7280",
];

const option = computed(() => {
    // 2. DEFINIR CONDICIONALMENTE A CONFIGURAÇÃO DOS EIXOS
    const yAxisConfig = props.horizontal
        ? {
              type: "category",
              data: labels.value,
              axisTick: { alignWithLabel: true },
              axisLabel: {
                  width: props.yAxisLabelWidth || 120,
                  overflow: "truncate",
                  ellipsis: "...",
                  color: isDark.value ? "#d1d5db" : "#6b7280",
              },
          } // Horizontal: Y é categoria
        : {
              type: "value",
              minInterval: 1,
              axisLabel: { color: isDark.value ? "#d1d5db" : "#6b7280" },
              splitLine: { lineStyle: { color: isDark.value ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.08)" } },
          }; // Vertical: Y é valor

    const xAxisConfig = props.horizontal
        ? {
              type: "value",
              minInterval: 1,
              axisLabel: { color: isDark.value ? "#d1d5db" : "#6b7280" },
          } // Horizontal: X é valor
        : {
              type: "category",
              data: labels.value,
              axisTick: { alignWithLabel: true },
              axisLabel: {
                  color: isDark.value ? "#d1d5db" : "#6b7280",
                  interval: labels.value.length > 16 ? "auto" : 0,
                  rotate: labels.value.length > 8 ? 35 : 0,
              },
          }; // Vertical: X é categoria

    // 3. AJUSTAR POSIÇÃO DO RÓTULO E MARGENS
    const labelPosition = props.horizontal ? "right" : "top";
    const gridLeftMargin = props.gridLeft || (props.horizontal ? "15%" : "3%");

    return {
        backgroundColor: "transparent",
        textStyle: { fontFamily: APP_FONT_FAMILY },
        tooltip: {
            show: true,
            trigger: "axis",
            axisPointer: { type: "shadow" },
            textStyle: {
                fontWeight: 500,
                fontSize: 13,
                color: isDark.value ? "#fff" : "#222",
            },
            backgroundColor: isDark.value ? "#23272b" : "#fff",
            borderColor: isDark.value ? "#444" : "#ddd",
        },
        legend: props.seriesData
            ? {
                  data: props.seriesData.series.map((s) => s.name),
                  type: "scroll",
                  top: 0,
                  textStyle: { color: isDark.value ? "#fff" : "#222" },
              }
            : undefined,
        grid: {
            left: gridLeftMargin, // Margem ajustada
            right: "4%",
            bottom: !props.horizontal && labels.value.length > 8 ? "18%" : "5%",
            top: props.seriesData ? "16%" : "7%",
            containLabel: true,
        },
        yAxis: yAxisConfig, // Configuração dinâmica
        xAxis: xAxisConfig, // Configuração dinâmica
        series: props.seriesData
            ? props.seriesData.series.map((serie, index) => ({
                  name: serie.name,
                  type: "bar",
                  data: serie.data,
                  itemStyle: {
                      borderColor: "transparent",
                      borderWidth: 0,
                      color: predefinedColors[index % predefinedColors.length],
                      borderRadius: props.horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0],
                  },
                  barMaxWidth: 34,
                  label: {
                      show: true,
                      position: labelPosition, // Posição do rótulo ajustada
                      formatter: ({ value }: any) => Number(value || 0) ? Number(value).toLocaleString("pt-BR") : "",
                  },
              }))
            : [
                  {
                      name: props.seriesName || "Interações",
                      type: "bar",
                      barWidth: "60%",
                      itemStyle: {
                          borderColor: "transparent",
                          borderWidth: 0,
                          color: (params: any) =>
                              predefinedColors[
                                  params.dataIndex % predefinedColors.length
                              ],
                          borderRadius: props.horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0],
                      },
                      data: values.value,
                      barMaxWidth: 38,
                      label: {
                          show: true,
                          position: labelPosition, // Posição do rótulo ajustada
                          formatter: ({ value }: any) => Number(value || 0) ? Number(value).toLocaleString("pt-BR") : "",
                      },
                  },
              ],
    };
});
</script>

<template>
    <div
        :style="{
            width: props.width || '100%',
            height: props.height || '300px',
        }"
    >
        <VChart
            ref="vchartRef"
            :option="option"
            :theme="isDark ? 'dark' : 'light'"
            autoresize
        />
    </div>
</template>
