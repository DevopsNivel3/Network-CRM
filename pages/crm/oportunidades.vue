<script setup lang="ts">
import { Plus, Filter, Opportunity, Histogram } from "@element-plus/icons-vue";

definePageMeta({
    requiredModule: "CRM",
    requiredPermission: UserPermissions.VER_OPORTUNIDADE,
});

const oportunidades = useOportunidades();
const oportunidade = useOportunidade();
const notifications = useNotifications();
const { user } = useAuthSession();
const { status, token } = useAuth();
const device = useDevice();
const chart = useChart();
const isCreateOportunidadeOpen = ref(false);
const isViewOportunidadeOpen = ref(false);
const isCreateBoardOpen = ref(false);
const isRealtimeRefreshing = ref(false);
let boardStreamSource: EventSource | null = null;
let boardStreamReconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Para abrir o modal de cadastro de oportunidade
const openCreateOportunidadeModal = () =>
    (isCreateOportunidadeOpen.value = true);

// Para abrir e fechar o filtro de pesquisa
const filterMenu = ref<boolean>(false);
const toggleFilterMenu = () => (filterMenu.value = !filterMenu.value);

// Para abrir e fechar o funnil
const isOpenedOnce = ref<boolean>(false);
const chartMenu = ref<boolean>(false);
const toggleChartMenu = () => (chartMenu.value = !chartMenu.value);

const route = useRoute();

type BoardRealtimePayload = {
    oportunidadeId?: number;
    previousBoardId?: number | null;
    previousPosicao?: number | null;
    boardId?: number | null;
    posicao?: number | null;
    actorUserId?: number;
};

const syncOpenedOpportunity = async (payload?: BoardRealtimePayload) => {
    const currentOpportunityId = Number(route.query.id || 0);
    if (
        currentOpportunityId &&
        (!payload?.oportunidadeId || payload.oportunidadeId === currentOpportunityId)
    ) {
        await oportunidade.findById(currentOpportunityId);
    }
};

const refreshBoardRealtime = async (payload?: BoardRealtimePayload) => {
    if (isRealtimeRefreshing.value) return;

    isRealtimeRefreshing.value = true;

    try {
        await oportunidades.findAll();
        await syncOpenedOpportunity(payload);
    } finally {
        isRealtimeRefreshing.value = false;
    }
};

const applyIncrementalBoardRealtime = async (
    eventType: string,
    payload: BoardRealtimePayload,
) => {
    const oportunidadeId = Number(payload?.oportunidadeId || 0);
    if (!oportunidadeId) return;

    if (oportunidades.hasActiveRealtimeFilters) {
        await refreshBoardRealtime(payload);
        return;
    }

    if (eventType === "board_card_removed") {
        oportunidades.removeRealtimeOportunidade(
            oportunidadeId,
            payload.previousBoardId,
        );
        await syncOpenedOpportunity(payload);
        return;
    }

    const realtimeCard =
        await oportunidades.fetchRealtimeOportunidadeById(oportunidadeId);

    if (!realtimeCard) {
        oportunidades.removeRealtimeOportunidade(
            oportunidadeId,
            payload.previousBoardId,
        );
        await syncOpenedOpportunity(payload);
        return;
    }

    oportunidades.upsertOportunidadeFromState(
        realtimeCard,
        payload.previousBoardId,
    );
    await syncOpenedOpportunity(payload);
};

const closeBoardStream = () => {
    if (boardStreamSource) {
        boardStreamSource.close();
        boardStreamSource = null;
    }

    if (boardStreamReconnectTimer) {
        clearTimeout(boardStreamReconnectTimer);
        boardStreamReconnectTimer = null;
    }
};

const scheduleBoardStreamReconnect = () => {
    if (boardStreamReconnectTimer) clearTimeout(boardStreamReconnectTimer);

    boardStreamReconnectTimer = setTimeout(() => {
        openBoardStream();
    }, 3000);
};

const openBoardStream = () => {
    if (status.value !== "authenticated" || !token.value) return;

    closeBoardStream();

    const url = `/api/oportunidades/board/stream?token=${encodeURIComponent(
        token.value || "",
    )}`;
    const source = new EventSource(url);

    source.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            if (
                !["board_card_updated", "board_card_created", "board_card_removed"].includes(
                    data?.type,
                )
            )
                return;

            await applyIncrementalBoardRealtime(data.type, data.payload || {});
        } catch (err) {
            console.error(err);
        }
    };

    source.onerror = () => {
        closeBoardStream();
        scheduleBoardStreamReconnect();
    };

    boardStreamSource = source;
};

// Busca os dados para exibir na tabela quando carrega a página
const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
    const isBoardLoaded = await oportunidades.findAllBoards();

    if (isBoardLoaded) {
        const isOportunidadesLoaded = await oportunidades.findAll();
        isDataLoaded.value = isOportunidadesLoaded;
    }

    if (route.query.id) {
        const opId = Number(route.query.id);
        const ok = await oportunidade.findById(opId);
        if (ok) {
            await notifications.markOpportunityAsRead(opId);
            isViewOportunidadeOpen.value = true;
        }
    }

    openBoardStream();
});

watch(() => route.query.id, async (newId) => {
    if (newId) {
        const opId = Number(newId);
        const ok = await oportunidade.findById(opId);
        if (ok) {
            await notifications.markOpportunityAsRead(opId);
            isViewOportunidadeOpen.value = true;
        }
    }
});

watch(
    () => status.value,
    (newStatus) => {
        if (newStatus === "authenticated") {
            openBoardStream();
            return;
        }

        closeBoardStream();
    },
);

// Somente puxa os dados do chart caso ele seja aberto
watch(
    () => chartMenu.value,
    (isOpen) => {
        if (isOpen && !isOpenedOnce.value) {
            isOpenedOnce.value = true;
            chart.oportunidadesChartFunil();
        }
    },
);

onUnmounted(() => {
    closeBoardStream();
});
</script>

<template>
    <div class="flex flex-col h-full w-full overflow-hidden">
        <div
            class="p-4 flex items-center md:gap-4 w-full md:bg-gray-50 dark:md:bg-charcoal dark:!border-white/15 !border-b"
        >
            <ElSkeleton
                class="w-full flex items-center justify-between"
                :loading="!isDataLoaded"
                animated
            >
                <template #template>
                    <ElSkeletonItem variant="text" class="!w-20 !h-5" />
                    <div class="flex items-center gap-2 md:gap-4">
                        <ElSkeletonItem variant="text" class="!w-12 !h-8" />
                        <ElSkeletonItem variant="text" class="!w-12 !h-8" />
                        <div
                            class="w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <ElSkeletonItem variant="text" class="!w-14 !h-8" />
                    </div>
                </template>
                <template #default>
                    <div
                        class="flex justify-between md:justify-start items-center gap-4 w-full"
                    >
                        <h1 class="font-medium text-base text-nowrap">
                            Oportunidades
                        </h1>
                        <div
                            class="hidden md:block w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <div class="hidden md:flex items-center gap-2">
                            <ElButton
                                v-if="
                                    hasUserPermission(
                                        user.permissoes,
                                        UserPermissions.CRIAR_OPORTUNIDADE,
                                    )
                                "
                                @click="openCreateOportunidadeModal"
                                type="primary"
                                :icon="Plus"
                                size="small"
                            >
                                Cadastrar
                            </ElButton>
                        </div>
                    </div>
                    <div class="flex gap-2 md:gap-4 items-center">
                        <div class="flex items-center">
                            <!-- Botão para abrir o menu de funnil -->
                            <ElTooltip
                                :content="
                                    !chartMenu
                                        ? 'Expandir gráfico'
                                        : 'Fechar gráfico'
                                "
                                :disabled="device.isMobile"
                                placement="bottom"
                                :hide-after="0"
                                effect="light"
                            >
                                <ElButton
                                    :icon="Histogram"
                                    @click="toggleChartMenu"
                                    :class="
                                        chartMenu
                                            ? '!text-nivel !border-nivel'
                                            : ''
                                    "
                                />
                            </ElTooltip>
                            <!-- Botão para abrir o menu de filtro -->
                            <ElTooltip
                                :content="
                                    !filterMenu
                                        ? 'Expandir filtro'
                                        : 'Fechar filtro'
                                "
                                :disabled="device.isMobile"
                                placement="bottom"
                                :hide-after="0"
                                effect="light"
                            >
                                <ElButton
                                    :icon="Filter"
                                    @click="toggleFilterMenu"
                                    :class="
                                        filterMenu
                                            ? '!text-nivel !border-nivel'
                                            : ''
                                    "
                                />
                            </ElTooltip>
                        </div>
                        <div
                            class="w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <!-- Total -->
                        <ElButton>
                            <div
                                class="flex items-center gap-2 md:gap-1 text-sm"
                            >
                                <ElIcon>
                                    <Opportunity />
                                </ElIcon>
                                <span class="hidden md:block"> Total: </span>
                                <span>
                                    {{
                                        formatNumber(
                                            (
                                                oportunidades.data.data
                                                    ?.length || 0
                                            ).toString(),
                                        )
                                    }}/{{
                                        formatNumber(
                                            oportunidades.data.total.toString(),
                                        )
                                    }}
                                </span>
                            </div>
                        </ElButton>
                    </div>
                </template>
            </ElSkeleton>
        </div>

        <ElScrollbar view-class="!h-full !w-full">
            <!-- Board -->
            <ElSkeleton
                :loading="!isDataLoaded || oportunidades.isLoading"
                class="!w-full !h-full !flex !p-4"
                animated
            >
                <template #template>
                    <div class="flex gap-4 w-full !overflow-hidden">
                        <ElSkeletonItem
                            variant="text"
                            class="!w-full md:!min-w-[300px] md:!max-w-[300px] !h-full !min-h-[calc(100vh-220px)] !rounded-lg"
                        />
                        <template v-if="$device.isDesktopOrTablet">
                            <ElSkeletonItem
                                variant="text"
                                class="!w-full !min-w-[300px] !max-w-[300px] !h-full !min-h-[calc(100vh-220px)] !rounded-lg"
                            />
                            <ElSkeletonItem
                                variant="text"
                                class="!w-full !min-w-[300px] !max-w-[300px] !h-full !min-h-[calc(100vh-220px)] !rounded-lg"
                            />
                            <ElSkeletonItem
                                variant="text"
                                class="!w-full !min-w-[300px] !max-w-[300px] !h-full !min-h-[calc(100vh-220px)] !rounded-lg"
                            />
                            <ElSkeletonItem
                                variant="text"
                                class="!w-full !min-w-[300px] !max-w-[300px] !h-full !min-h-[calc(100vh-220px)] !rounded-lg"
                            />
                            <ElSkeletonItem
                                variant="text"
                                class="!w-full !min-w-[300px] !max-w-[300px] !h-full !min-h-[calc(100vh-220px)] !rounded-lg"
                            />
                        </template>
                    </div>
                </template>
                <template #default>
                    <OportunidadeBoardContainerDesktop
                        v-if="$device.isDesktopOrTablet"
                        @open-view="isViewOportunidadeOpen = true"
                        @open-create-board="isCreateBoardOpen = true"
                    />
                    <OportunidadeBoardContainerMobile
                        v-if="$device.isMobile"
                        @open-view="isViewOportunidadeOpen = true"
                        @open-create-board="isCreateBoardOpen = true"
                    />
                </template>
            </ElSkeleton>

            <!--  Menu do filtro de pesquisa -->
            <div
                class="absolute bg-neutral-50 top-0 bottom-0 right-0 w-full max-w-[300px] !z-20 border-l-[0.5px] dark:border-white/15 dark:bg-eerie"
                v-show="filterMenu"
            >
                <OportunidadeFilterOptions />
            </div>
            <!--  Menu do Chart -->
            <div
                class="absolute bg-white top-0 bottom-0 right-0 w-full !z-20 dark:bg-eerie"
                v-show="chartMenu"
            >
                <OportunidadeChartPanel
                    @open-view="isViewOportunidadeOpen = true"
                />
            </div>
        </ElScrollbar>

        <!-- Botão para abrir o menu de cadastro MOBILE -->
        <div
            class="flex md:hidden items-center justify-center fixed bottom-0 right-0 mb-8 mr-4 z-10"
            v-if="
                hasUserPermission(
                    user.permissoes,
                    UserPermissions.CRIAR_OPORTUNIDADE,
                )
            "
        >
            <ElSkeleton
                class="w-full flex items-center justify-center"
                :loading="!isDataLoaded"
                animated
            >
                <template #template>
                    <ElSkeletonItem
                        variant="button"
                        class="!w-10 !h-10 !rounded-full"
                    />
                </template>
                <template #default>
                    <ElButton
                        @click="openCreateOportunidadeModal"
                        :circle="true"
                        type="primary"
                        :icon="Plus"
                        size="large"
                    />
                </template>
            </ElSkeleton>
        </div>

        <!-- Modal de Criação de Board -->
        <OportunidadeBoardCreateModal
            v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
            v-model="isCreateBoardOpen"
        />

        <!-- Modal de Criação -->
        <OportunidadeCreateModal
            v-if="
                hasUserPermission(
                    user.permissoes,
                    UserPermissions.CRIAR_OPORTUNIDADE,
                )
            "
            v-model="isCreateOportunidadeOpen"
        />
        <!-- Modal de visualização -->
        <OportunidadeViewModal v-model="isViewOportunidadeOpen" />
    </div>
</template>
