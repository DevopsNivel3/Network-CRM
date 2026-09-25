<script setup lang="ts">
import {
    CaretTop,
    CaretBottom,
    Warning,
    DCaret,
} from "@element-plus/icons-vue";
const device = useDevice();
const stats = useStats();
</script>

<template>
    <div class="hidden md:block">
        <div>
            <div
                class="px-2 md:px-6 py-2 md:py-3 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-center md:justify-start"
            >
                <!-- Card Total -->
                <div
                    class="app-surface w-full p-4 md:p-5"
                >
                    <ElStatistic :value="Number(stats.data?.total.value)">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1">
                                    <span
                                        class="truncate text-nivel text-sm font-medium"
                                    >
                                        Total
                                    </span>
                                </div>
                                <ElTooltip
                                    effect="light"
                                    content="Total de leads no sistema"
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
                        <span>{{ stats.data?.total.averagePerMonth }}/mês</span>
                        <span>{{ stats.data?.total.averagePerDay }}/dia</span>
                    </div>
                </div>

                <!-- Card Ano -->
                <div
                    class="app-surface w-full p-4 md:p-5"
                >
                    <ElStatistic :value="Number(stats.data?.year.total)">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1">
                                    <span
                                        class="truncate text-nivel text-sm font-medium"
                                    >
                                        {{ stats.data?.year.number }}
                                    </span>
                                </div>
                                <ElTooltip
                                    effect="light"
                                    content="Total de leads no ano"
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
                        class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
                        v-if="stats.data?.year.percentageChange"
                    >
                        Do que ano anterior
                        <ElIcon size="12">
                            <CaretTop
                                v-if="
                                    Number(stats.data?.year.percentageChange) >
                                    0
                                "
                                class="text-green-500"
                            />
                            <CaretBottom
                                v-else-if="
                                    Number(stats.data?.year.percentageChange) <
                                    0
                                "
                                class="text-red-500"
                            />
                            <DCaret v-else class="text-green-500" />
                        </ElIcon>
                        <span
                            :class="
                                Number(stats.data?.year.percentageChange) >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            "
                        >
                            {{
                                Math.abs(
                                    Number(stats.data.year.percentageChange),
                                ).toFixed(1)
                            }}%
                        </span>
                    </div>
                </div>

                <!-- Card Mês -->
                <div
                    class="app-surface w-full p-4 md:p-5"
                >
                    <ElStatistic :value="Number(stats.data?.month.total)">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1">
                                    <span
                                        class="truncate capitalize text-nivel text-sm font-medium"
                                    >
                                        {{
                                            $dayjs(
                                                new Date(
                                                    Number(
                                                        stats.data?.year.number,
                                                    ),
                                                    Number(
                                                        stats.data?.month
                                                            .number,
                                                    ) - 1,
                                                ),
                                            ).format("MMMM")
                                        }}
                                    </span>
                                </div>
                                <ElTooltip
                                    effect="light"
                                    content="Total de leads no mês"
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
                        v-if="stats.data?.month.percentageChange"
                        class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
                    >
                        Do que mês anterior
                        <ElIcon size="12">
                            <CaretTop
                                v-if="
                                    Number(stats.data?.month.percentageChange) >
                                    0
                                "
                                class="text-green-500"
                            />
                            <CaretBottom
                                v-else-if="
                                    Number(stats.data?.month.percentageChange) <
                                    0
                                "
                                class="text-red-500"
                            />
                            <DCaret v-else class="text-green-500" />
                        </ElIcon>
                        <span
                            :class="
                                Number(stats.data?.month.percentageChange) >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            "
                        >
                            {{
                                Math.abs(
                                    Number(stats.data.month.percentageChange),
                                ).toFixed(1)
                            }}%
                        </span>
                    </div>
                </div>

                <!-- Card Hoje -->
                <div
                    class="app-surface w-full p-4 md:p-5"
                >
                    <ElStatistic :value="Number(stats.data?.day.total)">
                        <template #title>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center gap-1">
                                    <span
                                        class="truncate text-black/80 dark:text-white/80 text-sm font-medium"
                                    >
                                        Hoje
                                    </span>
                                    <span
                                        class="text-xs truncate capitalize text-nivel font-medium"
                                    >
                                        ({{
                                            $dayjs(
                                                new Date(
                                                    Number(
                                                        stats.data?.year.number,
                                                    ),
                                                    Number(
                                                        stats.data?.month
                                                            .number,
                                                    ) - 1,
                                                    Number(
                                                        stats.data?.day.number,
                                                    ),
                                                ),
                                            ).format("dddd")
                                        }})
                                    </span>
                                </div>
                                <ElTooltip
                                    effect="light"
                                    content="Total de leads hoje"
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
                        v-if="stats.data?.day.percentageChange"
                        class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
                    >
                        Do que ontem
                        <ElIcon size="12">
                            <CaretTop
                                v-if="
                                    Number(stats.data?.day.percentageChange) > 0
                                "
                                class="text-green-500"
                            />
                            <CaretBottom
                                v-else-if="
                                    Number(stats.data?.day.percentageChange) < 0
                                "
                                class="text-red-500"
                            />
                            <DCaret v-else class="text-green-500" />
                        </ElIcon>
                        <span
                            :class="
                                Number(stats.data?.day.percentageChange) >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            "
                        >
                            {{
                                Math.abs(
                                    Number(stats.data.day.percentageChange),
                                ).toFixed(1)
                            }}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="p-6 w-full h-full">
            <HomeChart />
        </div>
        <div class="px-6 pb-6 w-full h-full grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div class="xl:col-span-3 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <h3
                        class="text-sm font-semibold text-gray-700 dark:text-white/80"
                    >
                        Oportunidades e Interações
                    </h3>
                </div>
                <HomeDashboardCharts />
            </div>

            <div class="xl:col-span-1 h-full max-h-[800px]">
                <HomeListInteractions />
            </div>
        </div>
    </div>
</template>
