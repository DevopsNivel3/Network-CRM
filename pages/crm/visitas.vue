<script setup lang="ts">
import {
    Filter,
    Place,
    Folder,
    Plus,
    CaretRight,
    Loading,
} from "@element-plus/icons-vue";

definePageMeta({
    requiredModule: Modules.CRM,
    requiredPermission: [
        UserPermissions.VER_VISITA,
        UserPermissions.VER_OPORTUNIDADE,
    ],
});

const { user: userAuth } = useAuthSession();
const visitas = useVisitas();
const device = useDevice();
const visita = useVisita();
const dayjs = useDayjs();
const route = useRoute();
const { columns: gridColumns, visibleColumns, load: loadGridPreferences, save: saveGridPreferences } = useVisitGridPreferences();
const isCreateVisitaOpen = ref(false);
const isViewVisitaOpen = ref(false);

// Para abrir e fechar o filtro de pesquisa
const filterMenu = ref<boolean>(false);
const toggleFilterMenu = () => (filterMenu.value = !filterMenu.value);

// Filtra os dados da tabela para exibir apenas as 100 dados
const filterTableData = computed(() => {
    return visitas.data.data
        ?.map((visita: any) => ({
            ...visita,
            isToday: dayjs(visita.data_inicio)
                .startOf("day")
                .isSame(dayjs().startOf("day")),
        }))
        .sort((a: any, b: any) => {
            // Using dayjs for date comparison
            const today = dayjs().startOf("day");
            const dateA = dayjs(a.data_inicio).startOf("day");
            const dateB = dayjs(b.data_inicio).startOf("day");

            const isTodayA = dateA.isSame(today);
            const isTodayB = dateB.isSame(today);

            // Prioriza visitas do dia atual
            if (isTodayA && !isTodayB) return -1;
            if (!isTodayA && isTodayB) return 1;

            // Ordena por data
            if (!dateA.isSame(dateB)) return dateA.diff(dateB);

            const timeToMinutes = (time: string) => {
                const [hours, minutes] = time.split(":").map(Number);
                return hours * 60 + minutes;
            };

            const timeA = timeToMinutes(a.hora_inicio);
            const timeB = timeToMinutes(b.hora_inicio);

            // Ordena pelo horário
            if (timeA !== timeB) return timeA - timeB;

            // Se o horário for igual ordena pelo status

            const getStatusValue = (statusInt: number): number => {
                const statusValue = visitas.getVisitaStatus[statusInt];
                return typeof statusValue === "number"
                    ? statusValue
                    : typeof statusValue === "string"
                      ? parseInt(statusValue, 10)
                      : 1;
            };
            const statusA = getStatusValue(a.statusInt) || 99;
            const statusB = getStatusValue(b.statusInt) || 99;

            return statusA - statusB;
        })
        .slice(0, 100);
});

const visitTableRef = ref<{ $el?: HTMLElement; doLayout?: () => void } | null>(null);
let resizeFrame: number | null = null;
let activeResize: { key: string; columnId: string; startX: number; startWidth: number; width: number } | null = null;
const paintColumnWidth = (columnId: string, width: number) => {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
        visitTableRef.value?.$el?.querySelectorAll<HTMLTableColElement>(`col[name="${columnId}"]`).forEach((col) => {
            col.width = String(width); col.style.width = `${width}px`;
        });
        resizeFrame = null;
    });
};
function moveColumnResize(event: PointerEvent) {
    if (!activeResize) return;
    activeResize.width = Math.min(600, Math.max(90, Math.round(activeResize.startWidth + event.clientX - activeResize.startX)));
    paintColumnWidth(activeResize.columnId, activeResize.width);
}
const stopColumnResize = () => {
    if (!activeResize) return;
    const resized = activeResize; activeResize = null;
    window.removeEventListener("pointermove", moveColumnResize);
    window.removeEventListener("pointerup", stopColumnResize);
    window.removeEventListener("pointercancel", stopColumnResize);
    document.body.classList.remove("is-resizing-visit-column");
    const target = gridColumns.value.find((item) => item.key === resized.key);
    if (target) target.width = resized.width;
    nextTick(() => visitTableRef.value?.doLayout?.());
    saveGridPreferences().catch(() => ElMessage.error("Não foi possível salvar a largura da coluna."));
};
const startColumnResize = (event: PointerEvent, key: string, columnId: string, width: number) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    activeResize = { key, columnId, startX: event.clientX, startWidth: width, width };
    document.body.classList.add("is-resizing-visit-column");
    window.addEventListener("pointermove", moveColumnResize, { passive: true });
    window.addEventListener("pointerup", stopColumnResize, { once: true });
    window.addEventListener("pointercancel", stopColumnResize, { once: true });
};

// Abre o modal de criação
const openCreateVisitaModal = () => (isCreateVisitaOpen.value = true);

// Abre o modal de visualização
const handleView = async (row: { id: number }) => {
    visita.findById(row.id);
    isViewVisitaOpen.value = true;
};

// Busca os dados para exibir na tabela quando carrega a página
const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
    const [res] = await Promise.all([visitas.findAll(), loadGridPreferences()]);
    isDataLoaded.value = res;

    if (route.query.id) {
        const visitaId = Number(route.query.id);
        const ok = await visita.findById(visitaId);
        if (ok) isViewVisitaOpen.value = true;
    }
});

watch(
    () => route.query.id,
    async (newId) => {
        if (!newId) return;
        const visitaId = Number(newId);
        const ok = await visita.findById(visitaId);
        if (ok) isViewVisitaOpen.value = true;
    },
);
onBeforeUnmount(() => {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    window.removeEventListener("pointermove", moveColumnResize);
    window.removeEventListener("pointerup", stopColumnResize);
    window.removeEventListener("pointercancel", stopColumnResize);
    document.body.classList.remove("is-resizing-visit-column");
});
</script>

<template>
    <div class="flex flex-col h-full w-full overflow-hidden">
        <div
            class="flex items-center justify-between md:gap-4 px-4 py-3 w-full dark:!border-white/15 !border-b"
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
                        <div
                            class="w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <ElSkeletonItem variant="text" class="!w-14 !h-8" />
                    </div>
                </template>
                <template #default>
                    <div class="flex items-center gap-4 w-full">
                        <h1 class="font-medium text-base text-nowrap">
                            Visitas
                        </h1>
                        <div
                            class="hidden md:block w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <div class="hidden md:flex items-center gap-2">
                            <ElButton
                                v-if="
                                    hasUserPermission(
                                        userAuth.permissoes,
                                        UserPermissions.CRIAR_VISITA,
                                    )
                                "
                                @click="openCreateVisitaModal"
                                type="primary"
                                :icon="Plus"
                                size="small"
                            >
                                Agendar
                            </ElButton>
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 md:gap-4 items-center">
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
                        <div
                            class="w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <!-- Total -->
                        <ElButton>
                            <div class="flex items-center gap-1 text-sm">
                                <ElIcon>
                                    <Place />
                                </ElIcon>
                                Total:
                                <span>
                                    {{
                                        formatNumber(
                                            visitas.data.total.toString(),
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
            <!-- Tabelas com os dados -->
            <ElTable
                ref="visitTableRef"
                v-if="isDataLoaded && !visitas.isLoading && visitas.data"
                empty-text="Sem dados para exibir."
                :data="filterTableData"
                class="visit-table !grow !h-full"
                :fit="true"
            >
                <ElTableColumn v-for="column in visibleColumns" :key="column.key" :label="column.label" :prop="column.key" :min-width="column.width" :resizable="false">
                    <template #header="{ column: tableColumn }">
                        <div class="visit-column-header">
                            <span class="min-w-0 flex-1 truncate">{{ column.label }}</span>
                            <span class="visit-column-resize-handle" title="Arraste para ajustar a largura" @pointerdown="startColumnResize($event, column.key, tableColumn.id, column.width)" />
                        </div>
                    </template>
                    <template #default="scope">
                        <div v-if="column.key === 'oportunidade.lead.nome_lead'" class="flex items-center gap-2">
                            <ElTooltip v-if="scope.row.isToday" :disabled="device.isMobile" placement="left" :hide-after="0" effect="light" content="Hoje"><ElIcon class="!text-nivel"><CaretRight /></ElIcon></ElTooltip>
                            <span class="truncate">{{ scope.row.oportunidade.lead.nome_lead }}</span>
                        </div>
                        <span v-else-if="column.key === 'localizacao.cidade'" class="truncate">{{ scope.row.localizacao.cidade }}</span>
                        <ElTag v-else-if="column.key === 'statusInt'" effect="dark" disable-transitions :class="{ '!bg-yellow-500 !border-yellow-500': scope.row.statusInt === 1, '!bg-blue-300 !border-blue-300': scope.row.statusInt === 2, '!bg-nivel !border-nivel': scope.row.statusInt === 5, '!bg-red-500 !border-red-500': scope.row.statusInt === 4, '!bg-cyan-500 !border-cyan-500': scope.row.statusInt === 3 }"><span class="font-medium">{{ visitas.getVisitaStatus[scope.row.statusInt] }}</span></ElTag>
                        <span v-else-if="column.key === 'data_inicio'" class="truncate capitalize">{{ $dayjs(scope.row.data_inicio).format("ddd, DD MMM YYYY") + ", " + scope.row.hora_inicio.slice(0, 5) }}</span>
                        <span v-else-if="column.key === 'data_fim'" class="truncate capitalize">{{ scope.row.data_fim ? $dayjs(scope.row.data_fim).format("ddd, DD MMM YYYY, HH:mm") : "-" }}</span>
                    </template>
                </ElTableColumn>
                <ElTableColumn
                    width="72"
                    class-name="visita-actions-column"
                    header-cell-class-name="visita-actions-column"
                >
                    <template #default="scope">
                        <div class="w-full flex items-center">
                            <ElTooltip
                                :disabled="device.isMobile"
                                content="Visualizar"
                                placement="bottom"
                                effect="light"
                                :hide-after="0"
                            >
                                <ElButton
                                    @click="handleView(scope.row)"
                                    class="!w-full md:!w-fit"
                                    :icon="Folder"
                                    size="small"
                                />
                            </ElTooltip>
                        </div>
                    </template>
                </ElTableColumn>
                <template #empty>
                    <div
                        class="absolute inset-0 h-full w-full flex items-center justify-center"
                    >
                        <ElEmpty description="Sem dados para exibir." />
                    </div>
                </template>
            </ElTable>

            <!-- Tela de carregamento -->
            <div
                v-else
                class="flex items-center justify-center !grow h-full w-full"
            >
                <ElIcon
                    class="is-loading"
                    color="var(--el-color-primary)"
                    size="25"
                >
                    <Loading />
                </ElIcon>
            </div>

            <!--  Menu do filtro de pesquisa -->
            <div
                class="absolute bg-neutral-50 top-0 bottom-0 right-0 w-full max-w-[300px] !z-20 border-l-[0.5px] dark:border-white/15 dark:bg-eerie"
                v-show="filterMenu"
            >
                <VisitaFilterOptions />
            </div>
        </ElScrollbar>

        <!-- Páginação de 100 em 100 -->
        <div
            class="w-full flex items-center justify-center !py-3 !px-4 dark:!border-white/15 !border-t"
        >
            <ElSkeleton
                class="w-full flex items-center justify-center"
                :loading="!isDataLoaded"
                animated
            >
                <template #template>
                    <ElSkeletonItem variant="text" class="!w-16 !h-8" />
                </template>
                <template #default>
                    <ElPagination
                        @current-change="visitas.handlePageChange"
                        :current-page.sync="visitas.page"
                        :page-size="visitas.perPage"
                        :total="visitas.data.total"
                        layout="prev, pager, next"
                    />
                </template>
            </ElSkeleton>
        </div>

        <!-- Botão para abrir o menu de cadastro MOBILE -->
        <div
            class="flex md:hidden items-center justify-center fixed bottom-0 right-0 mb-20 mr-4 z-10"
            v-if="
                hasUserPermission(
                    userAuth.permissoes,
                    UserPermissions.CRIAR_VISITA,
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
                        @click="openCreateVisitaModal"
                        :circle="true"
                        type="primary"
                        :icon="Plus"
                        size="large"
                    />
                </template>
            </ElSkeleton>
        </div>

        <!-- Modal de criação -->
        <VisitaCreateModal
            v-if="
                hasUserPermission(
                    userAuth.permissoes,
                    UserPermissions.CRIAR_VISITA,
                )
            "
            showOportunidadeSelect
            v-model="isCreateVisitaOpen"
        />

        <!-- Modal de visualização -->
        <VisitaViewModal v-model="isViewVisitaOpen" />
    </div>
</template>

<style scoped>
.el-table__body-wrapper .el-scrollbar__wrap,
.el-table__body-wrapper .el-scrollbar__wrap .el-scrollbar__view {
    height: 100% !important;
    width: 100% !important;
}

:deep(.visita-actions-column) {
    background: var(--el-bg-color) !important;
}

:deep(.el-table__row:hover .visita-actions-column) {
    background: var(--el-fill-color-light) !important;
}

:deep(.visita-actions-column .cell) {
    display: flex;
    justify-content: center;
    overflow: hidden;
    padding-left: 8px;
    padding-right: 8px;
}

:deep(.visit-column-header) {
    position: static;
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    align-items: center;
}

:deep(.visit-table .el-table__header th:not(.visita-actions-column) > .cell) {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: visible;
}

:deep(.visit-column-resize-handle) {
    position: absolute;
    z-index: 3;
    top: -12px;
    right: -4px;
    bottom: -12px;
    width: 10px;
    cursor: col-resize;
    touch-action: none;
}

:deep(.visit-column-resize-handle:hover)::after {
    content: "";
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 4px;
    width: 2px;
    border-radius: 9999px;
    background: var(--el-color-primary);
}

:global(body.is-resizing-visit-column),
:global(body.is-resizing-visit-column *) {
    cursor: col-resize !important;
    user-select: none !important;
}
</style>
