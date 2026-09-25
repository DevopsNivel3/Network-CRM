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
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { fontFamily: APP_FONT_FAMILY },
  tooltip: {
    show: true,
    textStyle: {
      fontWeight: 500,
      fontSize: 13,
      color: isDark.value ? "#fff" : "#222",
    },
    backgroundColor: isDark.value ? "#23272b" : "#fff",
    borderColor: isDark.value ? "#444" : "#ddd",
    trigger: "axis",
    axisPointer: {
      type: "cross",
    },
  },
  legend: (props.seriesData && props.seriesData.series) ? {
    data: props.seriesData.series.map(s => s.name),
    type: "scroll",
    top: 0,
    textStyle: {
      color: isDark.value ? "#fff" : "#222",
    },
  } : undefined,
  grid: {
    left: "3%",
    right: "4%",
    bottom: labels.value.length > 8 ? "18%" : "6%",
    top: props.seriesData ? "16%" : "7%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: labels.value,
    axisLabel: {
      color: isDark.value ? "#d1d5db" : "#6b7280",
      interval: labels.value.length > 16 ? "auto" : 0,
      rotate: labels.value.length > 8 ? 35 : 0,
    },
    axisLine: { lineStyle: { color: isDark.value ? "#404040" : "#e5e7eb" } },
  },
  yAxis: {
    type: "value",
    minInterval: 1,
    splitLine: { lineStyle: { color: isDark.value ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.08)" } },
    axisLabel: { color: isDark.value ? "#d1d5db" : "#6b7280" },
  },
  series: (props.seriesData && props.seriesData.series) ? 
    props.seriesData.series.map((serie, index) => ({
      name: serie.name,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      showSymbol: labels.value.length <= 20,
      areaStyle: {
        opacity: 0.1,
      },
      lineStyle: {
        width: 3,
      },
      itemStyle: {
        color: predefinedColors[index % predefinedColors.length],
      },
      data: serie.data,
      label: {
        show: false,
        position: "top",
      },
      connectNulls: false,
      emphasis: { focus: "series" },
    })) :
    [
      {
        name: "Interações",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        areaStyle: {
          opacity: 0.1,
        },
        lineStyle: {
          width: 2,
        },
        itemStyle: {
          color: "#79fe96",
        },
        data: values.value,
        label: {
          show: true,
          position: "top",
        },
      },
    ],
}));
</script>

<template>
  <div :style="{ width: props.width || '100%', height: props.height || '300px' }">
    <VChart ref="vchartRef" :option="option" :theme="isDark ? 'dark' : 'light'" autoresize />
  </div>
</template>
