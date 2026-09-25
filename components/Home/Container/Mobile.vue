<script setup lang="ts">
import {
    ArrowRightBold,
    ArrowLeftBold,
    CaretTop,
    CaretBottom,
    Warning,
    DCaret,
} from "@element-plus/icons-vue";
const stats = useStats();
const swiperRef = ref();
const swiper = useSwiper(swiperRef);
const device = useDevice();
</script>

<template>
    <div class="block md:hidden">
        <swiper-container :autoHeight="true" ref="swiperRef" :height="100">
            <swiper-slide>
                <div>
                    <div
                        class="flex items-center justify-between bg-gray-50 dark:!border-white/15 border-b dark:bg-charcoal p-4 gap-4"
                    >
                        <h1 class="font-medium text-base text-nowrap">
                            Estatísticas
                        </h1>
                        <ElButton
                            class="!flex md:!hidden text-xs font-medium items-center"
                            @click="swiper.next()"
                            type="text"
                        >
                            <span class="mr-2">Gráfico</span>
                            <ElIcon size="small">
                                <ArrowRightBold />
                            </ElIcon>
                        </ElButton>
                    </div>
                    <div class="px-2 py-2 flex flex-col gap-2">
                        <!-- Card Total -->
                        <div
                            class="app-surface w-full p-4 md:p-5"
                        >
                            <ElStatistic
                                :value="Number(stats.data?.total.value)"
                            >
                                <template #title>
                                    <div class="flex items-center gap-2">
                                        <div class="flex items-center gap-1">
                                            <span
                                                class="truncate text-nivel text-sm font-medium"
                                                >Total</span
                                            >
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
                                <span
                                    >{{
                                        stats.data?.total.averagePerMonth
                                    }}/mês</span
                                >
                                <span
                                    >{{
                                        stats.data?.total.averagePerDay
                                    }}/dia</span
                                >
                            </div>
                        </div>

                        <!-- Card Ano -->
                        <div
                            class="app-surface w-full p-4 md:p-5"
                        >
                            <ElStatistic
                                :value="Number(stats.data?.year.total)"
                            >
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
                                v-if="stats.data?.year.percentageChange"
                                class="flex items-center text-xs gap-1 mt-2 text-black/60 dark:text-white/60"
                            >
                                Do que ano anterior
                                <ElIcon size="12">
                                    <CaretTop
                                        v-if="
                                            Number(
                                                stats.data?.year
                                                    .percentageChange,
                                            ) > 0
                                        "
                                        class="text-green-500"
                                    />
                                    <CaretBottom
                                        v-else-if="
                                            Number(
                                                stats.data?.year
                                                    .percentageChange,
                                            ) < 0
                                        "
                                        class="text-red-500"
                                    />
                                    <DCaret v-else class="text-green-500" />
                                </ElIcon>
                                <span
                                    :class="
                                        Number(
                                            stats.data?.year.percentageChange,
                                        ) >= 0
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                    "
                                >
                                    {{
                                        Math.abs(
                                            Number(
                                                stats.data.year
                                                    .percentageChange,
                                            ),
                                        ).toFixed(1)
                                    }}%
                                </span>
                            </div>
                        </div>

                        <!-- Card Mês -->
                        <div
                            class="app-surface w-full p-4 md:p-5"
                        >
                            <ElStatistic
                                :value="Number(stats.data?.month.total)"
                            >
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
                                                                stats.data?.year
                                                                    .number,
                                                            ),
                                                            Number(
                                                                stats.data
                                                                    ?.month
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
                                            Number(
                                                stats.data?.month
                                                    .percentageChange,
                                            ) > 0
                                        "
                                        class="text-green-500"
                                    />
                                    <CaretBottom
                                        v-else-if="
                                            Number(
                                                stats.data?.month
                                                    .percentageChange,
                                            ) < 0
                                        "
                                        class="text-red-500"
                                    />
                                    <DCaret v-else class="text-green-500" />
                                </ElIcon>
                                <span
                                    :class="
                                        Number(
                                            stats.data?.month.percentageChange,
                                        ) >= 0
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                    "
                                >
                                    {{
                                        Math.abs(
                                            Number(
                                                stats.data.month
                                                    .percentageChange,
                                            ),
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
                                                                stats.data?.year
                                                                    .number,
                                                            ),
                                                            Number(
                                                                stats.data
                                                                    ?.month
                                                                    .number,
                                                            ) - 1,
                                                            Number(
                                                                stats.data?.day
                                                                    .number,
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
                                            Number(
                                                stats.data?.day
                                                    .percentageChange,
                                            ) > 0
                                        "
                                        class="text-green-500"
                                    />
                                    <CaretBottom
                                        v-else-if="
                                            Number(
                                                stats.data?.day
                                                    .percentageChange,
                                            ) < 0
                                        "
                                        class="text-red-500"
                                    />
                                    <DCaret v-else class="text-green-500" />
                                </ElIcon>
                                <span
                                    :class="
                                        Number(
                                            stats.data?.day.percentageChange,
                                        ) >= 0
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                    "
                                >
                                    {{
                                        Math.abs(
                                            Number(
                                                stats.data.day.percentageChange,
                                            ),
                                        ).toFixed(1)
                                    }}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </swiper-slide>
            <swiper-slide>
                <div
                    class="flex dark:!border-white/15 border-b items-center flex-row-reverse md:flex-row justify-between bg-gray-50 dark:bg-charcoal p-4 gap-4"
                >
                    <h1 class="font-medium text-base text-nowrap">Gráfico</h1>
                    <div class="flex items-center gap-2">
                        <ElButton
                            class="!flex md:!hidden text-xs font-medium items-center"
                            @click="swiper.prev()"
                            type="text"
                        >
                            <ElIcon size="small">
                                <ArrowLeftBold />
                            </ElIcon>
                            <span class="ml-2">Estatísticas</span>
                        </ElButton>
                        <ElButton
                            class="!flex md:!hidden text-xs font-medium items-center"
                            @click="swiper.next()"
                            type="text"
                        >
                            <span class="mr-2">Mais gráficos</span>
                            <ElIcon size="small">
                                <ArrowRightBold />
                            </ElIcon>
                        </ElButton>
                    </div>
                </div>
                <div class="px-6 py-3 w-full h-full">
                    <HomeChart />
                </div>
            </swiper-slide>
            <swiper-slide>
                <div
                    class="flex dark:!border-white/15 border-b items-center justify-between bg-gray-50 dark:bg-charcoal p-4 gap-4"
                >
                    <h1 class="font-medium text-base text-nowrap">
                        Oportunidades
                    </h1>
                    <div class="flex items-center gap-2">
                        <ElButton
                            class="!flex md:!hidden text-xs font-medium items-center"
                            @click="swiper.prev()"
                            type="text"
                        >
                            <ElIcon size="small">
                                <ArrowLeftBold />
                            </ElIcon>
                            <span class="ml-2">Gráfico</span>
                        </ElButton>
                        <ElButton
                            class="!flex md:!hidden text-xs font-medium items-center"
                            @click="swiper.next()"
                            type="text"
                        >
                            <span class="mr-2">Interações</span>
                            <ElIcon size="small">
                                <ArrowRightBold />
                            </ElIcon>
                        </ElButton>
                    </div>
                </div>
                <div class="px-4 py-3 w-full h-full">
                    <HomeDashboardCharts />
                </div>
            </swiper-slide>
            <swiper-slide>
                <div
                    class="flex dark:!border-white/15 border-b items-center justify-between bg-gray-50 dark:bg-charcoal p-4 gap-4"
                >
                    <h1 class="font-medium text-base text-nowrap">
                        Interações
                    </h1>
                    <ElButton
                        class="!flex md:!hidden text-xs font-medium items-center"
                        @click="swiper.prev()"
                        type="text"
                    >
                        <ElIcon size="small">
                            <ArrowLeftBold />
                        </ElIcon>
                        <span class="ml-2">Oportunidades</span>
                    </ElButton>
                </div>
                <div class="px-4 py-3 w-full h-full">
                    <HomeListInteractions />
                </div>
            </swiper-slide>
        </swiper-container>
    </div>
</template>
