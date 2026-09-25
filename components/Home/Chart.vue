<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Bar } from "vue-chartjs";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { APP_FONT_FAMILY } from "~/utils/design";

ChartJS.register(ChartDataLabels, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
ChartJS.defaults.font.family = APP_FONT_FAMILY;

const monthLabels = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const colorPalette = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1",
];

const { user } = useAuthSession();
const { isDark } = useTheme();
const device = useDevice();
const stats = useStats();

const chartData = reactive<ChartData<"bar">>({
  labels: monthLabels,
  datasets: [],
});

const updateChartData = () => {
  const months = stats.data?.year?.months;
  if (!months) {
    chartData.datasets = [];
    return;
  }

  const showByUser =
    stats.filterByUserId === "all" &&
    hasUserPermission(user.permissoes, UserPermissions.ADMIN);

  if (showByUser) {
    const valuesByUser = new Map<string, number[]>();

    Object.entries(months).forEach(([monthKey, monthData]: [string, any]) => {
      const monthIndex = Number(monthKey) - 1;
      if (monthIndex < 0 || monthIndex > 11 || typeof monthData !== "object") return;

      Object.entries(monthData).forEach(([userName, value]) => {
        const values = valuesByUser.get(userName) || Array(12).fill(0);
        values[monthIndex] = Number(value || 0);
        valuesByUser.set(userName, values);
      });
    });

    chartData.datasets = Array.from(valuesByUser.entries()).map(
      ([userName, values], index) => ({
        label: userName,
        data: values,
        backgroundColor: `${colorPalette[index % colorPalette.length]}CC`,
        borderColor: colorPalette[index % colorPalette.length],
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 30,
      }),
    );
    return;
  }

  const values = Array(12).fill(0);
  Object.entries(months).forEach(([monthKey, value]) => {
    const monthIndex = Number(monthKey) - 1;
    if (monthIndex >= 0 && monthIndex <= 11) values[monthIndex] = Number(value || 0);
  });

  chartData.datasets = [{
    label: "Oportunidades",
    data: values,
    backgroundColor: colorPalette.map((color) => `${color}CC`),
    borderColor: colorPalette,
    borderWidth: 1,
    borderRadius: 6,
    maxBarThickness: 36,
  }];
};

watch(
  [() => stats.data, () => stats.filterByUserId],
  updateChartData,
  { immediate: true, deep: true },
);

const chartOptions = computed<ChartOptions<"bar">>(() => {
  const textColor = isDark.value ? "#e5e7eb" : "#374151";
  const mutedColor = isDark.value ? "#9ca3af" : "#6b7280";
  const gridColor = isDark.value ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.08)";
  const isMobile = device.isMobile;

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: isMobile ? "y" : "x",
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 8, right: 12 } },
    animation: { duration: 450 },
    plugins: {
      datalabels: {
        anchor: "end",
        align: isMobile ? "right" : "top",
        clamp: true,
        color: textColor,
        font: { size: 11, weight: 600 },
        formatter: (value) => Number(value || 0) > 0 ? Number(value).toLocaleString("pt-BR") : "",
      },
      legend: {
        display: chartData.datasets.length > 1,
        position: "bottom",
        labels: { color: textColor, usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 16 },
      },
      title: {
        display: true,
        align: "start",
        color: textColor,
        font: { size: 14, weight: 600 },
        padding: { bottom: 20 },
        text: `Oportunidades por mês • ${stats.data?.year?.number || new Date().getFullYear()}`,
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark.value ? "#171717" : "#ffffff",
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: isDark.value ? "#404040" : "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${Number(context.raw || 0).toLocaleString("pt-BR")}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: isMobile, color: gridColor },
        border: { display: false },
        ticks: { color: mutedColor, precision: 0, maxRotation: 0 },
      },
      y: {
        beginAtZero: true,
        grid: { display: !isMobile, color: gridColor },
        border: { display: false },
        ticks: { color: mutedColor, precision: 0 },
      },
    },
  };
});
</script>

<template>
  <div class="app-surface w-full h-[520px] md:h-[420px] p-3 md:p-5">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
