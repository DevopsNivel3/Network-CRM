<script setup lang="ts">
import {
  Warning,
  CaretTop,
  CaretBottom,
  DCaret,
} from "@element-plus/icons-vue";

const device = useDevice();
const {
  formatCurrency,
  periodConversionRate,
  periodLeads,
  periodOportunidades,
  periodPipelineValue,
  periodStats,
  periodTicketMedio,
} = useCrmDashboardMetrics();
</script>

<template>
  <section class="space-y-3">
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <div class="app-surface h-full min-h-[140px] p-4 md:p-5">
        <ElStatistic :value="Number(periodLeads)">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="truncate text-nivel text-sm font-medium"
                >Leads no período</span
              >
              <ElTooltip
                effect="light"
                content="Total de leads no período filtrado"
                placement="top"
                :disabled="device.isMobile"
              >
                <ElIcon class="mr-3" :size="12">
                  <Warning />
                </ElIcon>
              </ElTooltip>
            </div>
          </template>
        </ElStatistic>
        <div
          class="flex flex-row text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
        >
          <span>Média -</span>
          <span>{{ periodStats?.averageLeadsPerDay }}/dia</span>
        </div>
        <div
          class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
          v-if="periodStats?.leadsPercentageChange"
        >
          Vs período anterior
          <ElIcon size="12">
            <CaretTop
              v-if="Number(periodStats?.leadsPercentageChange) > 0"
              class="text-green-500"
            />
            <CaretBottom
              v-else-if="Number(periodStats?.leadsPercentageChange) < 0"
              class="text-red-500"
            />
            <DCaret v-else class="text-green-500" />
          </ElIcon>
          <span
            :class="
              Number(periodStats?.leadsPercentageChange) >= 0
                ? 'text-green-500'
                : 'text-red-500'
            "
          >
            {{
              Math.abs(Number(periodStats?.leadsPercentageChange)).toFixed(1)
            }}%
          </span>
        </div>
      </div>

      <div class="app-surface h-full min-h-[140px] p-4 md:p-5">
        <ElStatistic :value="Number(periodOportunidades)">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="truncate text-nivel text-sm font-medium">
                Oportunidades no período
              </span>
              <ElTooltip
                effect="light"
                content="Total de oportunidades no período filtrado"
                placement="top"
                :disabled="device.isMobile"
              >
                <ElIcon class="mr-3" :size="12">
                  <Warning />
                </ElIcon>
              </ElTooltip>
            </div>
          </template>
        </ElStatistic>
        <div
          class="flex flex-row text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
        >
          <span>Média -</span>
          <span>{{ periodStats?.averageOportunidadesPerDay }}/dia</span>
        </div>
        <div
          class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
          v-if="periodStats?.oportunidadesPercentageChange"
        >
          Vs período anterior
          <ElIcon size="12">
            <CaretTop
              v-if="Number(periodStats?.oportunidadesPercentageChange) > 0"
              class="text-green-500"
            />
            <CaretBottom
              v-else-if="Number(periodStats?.oportunidadesPercentageChange) < 0"
              class="text-red-500"
            />
            <DCaret v-else class="text-green-500" />
          </ElIcon>
          <span
            :class="
              Number(periodStats?.oportunidadesPercentageChange) >= 0
                ? 'text-green-500'
                : 'text-red-500'
            "
          >
            {{
              Math.abs(
                Number(periodStats?.oportunidadesPercentageChange),
              ).toFixed(1)
            }}%
          </span>
        </div>
      </div>

      <div class="app-surface h-full min-h-[140px] p-4 md:p-5">
        <ElStatistic :value="periodPipelineValue" :formatter="formatCurrency">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="truncate capitalize text-nivel text-sm font-medium">
                Valor do pipeline
              </span>
              <ElTooltip
                effect="light"
                content="Valor estimado do pipeline no período filtrado"
                placement="top"
                :disabled="device.isMobile"
              >
                <ElIcon class="mr-3" :size="12">
                  <Warning />
                </ElIcon>
              </ElTooltip>
            </div>
          </template>
        </ElStatistic>
        <div
          class="flex flex-row text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
        >
          <span>Ticket médio -</span>
          <span>{{ formatCurrency(periodTicketMedio) }}</span>
        </div>
        <div
          v-if="periodStats?.pipelinePercentageChange"
          class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
        >
          Vs período anterior
          <ElIcon size="12">
            <CaretTop
              v-if="Number(periodStats?.pipelinePercentageChange) > 0"
              class="text-green-500"
            />
            <CaretBottom
              v-else-if="Number(periodStats?.pipelinePercentageChange) < 0"
              class="text-red-500"
            />
            <DCaret v-else class="text-green-500" />
          </ElIcon>
          <span
            :class="
              Number(periodStats?.pipelinePercentageChange) >= 0
                ? 'text-green-500'
                : 'text-red-500'
            "
          >
            {{
              Math.abs(Number(periodStats?.pipelinePercentageChange)).toFixed(
                1,
              )
            }}%
          </span>
        </div>
      </div>

      <div class="app-surface h-full min-h-[140px] p-4 md:p-5">
        <ElStatistic :value="periodConversionRate" :precision="1" suffix="%">
          <template #title>
            <div class="flex items-center gap-2">
              <span
                class="truncate text-black/80 dark:text-white/80 text-sm font-medium"
              >
                Conversão no período
              </span>
              <ElTooltip
                effect="light"
                content="Conversão de oportunidades sobre leads no período filtrado"
                placement="top"
                :disabled="device.isMobile"
              >
                <ElIcon class="mr-3" :size="12">
                  <Warning />
                </ElIcon>
              </ElTooltip>
            </div>
          </template>
        </ElStatistic>
        <div
          class="flex flex-row text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
        >
          Oportunidades / Leads
        </div>
        <div
          v-if="periodStats?.conversionPercentageChange"
          class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
        >
          Vs período anterior
          <ElIcon size="12">
            <CaretTop
              v-if="Number(periodStats?.conversionPercentageChange) > 0"
              class="text-green-500"
            />
            <CaretBottom
              v-else-if="Number(periodStats?.conversionPercentageChange) < 0"
              class="text-red-500"
            />
            <DCaret v-else class="text-green-500" />
          </ElIcon>
          <span
            :class="
              Number(periodStats?.conversionPercentageChange) >= 0
                ? 'text-green-500'
                : 'text-red-500'
            "
          >
            {{
              Math.abs(Number(periodStats?.conversionPercentageChange)).toFixed(
                1,
              )
            }}%
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
