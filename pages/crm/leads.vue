<script setup lang="ts">
import {
    Plus,
    Loading,
    OfficeBuilding,
    Folder,
    Filter,
    CaretRight,
    UploadFilled,
    WarningFilled,
} from "@element-plus/icons-vue";

definePageMeta({
    requiredModule: "CRM",
    requiredPermission: UserPermissions.VER_LEAD,
});

const { user } = useAuthSession();
const device = useDevice();
const dayjs = useDayjs();
const leads = useLeads();
const lead = useLead();
const { columns: gridColumns, visibleColumns, load: loadGridPreferences, save: saveGridPreferences } = useLeadGridPreferences();
const pendingLeadDraft = useState<Partial<FormLeadCreate> | null>(
    "lead:create:draft",
    () => null,
);
const isExportDataOpen = ref(false);
const isCreateLeadOpen = ref(false);
const isViewLeadOpen = ref(false);

const origemLeadLabels: Record<string, string> = {
    indicacao: "Indicação",
    facebook: "Facebook",
    google: "Google",
    pap: "PAP",
    sdr: "SDR",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    whatsapp: "WhatsApp",
    email: "Email",
    evento: "Evento",
    site: "Site",
    networking: "Networking",
    inbound: "Inbound",
    outbound: "Outbound",
    telemarketing: "Telemarketing",
    vendas_diretas: "Vendas Diretas",
};

const formatDateTime = (value?: string | null) =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "Sem registro";

const formatOrigin = (value?: string | null) =>
    value ? origemLeadLabels[value] || value : "Não informada";

const getPriorityTag = (priority: string) => {
    if (priority === "alta") return { type: "danger", label: "Alta" };
    if (priority === "media") return { type: "warning", label: "Média" };
    return { type: "info", label: "Normal" };
};

// Para abrir e fechar o filtro de pesquisa
const filterMenu = ref<boolean>(false);
const toggleFilterMenu = () => (filterMenu.value = !filterMenu.value);

// Para abrir e fechar exportador de dados
const openExportDataModal = () => (isExportDataOpen.value = true);

// Filtra os dados da tabela para exibir apenas as 100 dados
const filterTableData = computed(() => leads.data.data?.slice(0, 100));
const leadTableRef = ref<{ $el?: HTMLElement; doLayout?: () => void } | null>(null);
let resizeFrame: number | null = null;
let activeResize: { key: string; columnId: string; startX: number; startWidth: number; width: number } | null = null;

const paintColumnWidth = (columnId: string, width: number) => {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
        const root = leadTableRef.value?.$el;
        root?.querySelectorAll<HTMLTableColElement>(`col[name="${columnId}"]`).forEach((col) => {
            col.width = String(width);
            col.style.width = `${width}px`;
        });
        resizeFrame = null;
    });
};

const stopColumnResize = () => {
    if (!activeResize) return;
    const resized = activeResize;
    activeResize = null;
    window.removeEventListener("pointermove", moveColumnResize);
    window.removeEventListener("pointerup", stopColumnResize);
    window.removeEventListener("pointercancel", stopColumnResize);
    document.body.classList.remove("is-resizing-lead-column");
    const target = gridColumns.value.find((item) => item.key === resized.key);
    if (target) target.width = resized.width;
    nextTick(() => leadTableRef.value?.doLayout?.());
    saveGridPreferences().catch(() => ElMessage.error("Não foi possível salvar a largura da coluna."));
};

function moveColumnResize(event: PointerEvent) {
    if (!activeResize) return;
    activeResize.width = Math.min(600, Math.max(90, Math.round(activeResize.startWidth + event.clientX - activeResize.startX)));
    paintColumnWidth(activeResize.columnId, activeResize.width);
}

const startColumnResize = (event: PointerEvent, key: string, columnId: string, width: number) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    activeResize = { key, columnId, startX: event.clientX, startWidth: width, width };
    document.body.classList.add("is-resizing-lead-column");
    window.addEventListener("pointermove", moveColumnResize, { passive: true });
    window.addEventListener("pointerup", stopColumnResize, { once: true });
    window.addEventListener("pointercancel", stopColumnResize, { once: true });
};

// Abre o modal de criação
const openCreateLeadModal = () => (isCreateLeadOpen.value = true);

// Abre o modal de visualização
const handleView = async (row: { id: number }) => {
    lead.findById(row.id);
    isViewLeadOpen.value = true;
};

// Verifica se o lead está dentro do mês atual
const isNewLead = (criado: Date | string) => {
    const created = dayjs(criado);
    const now = dayjs();
    return created.isSame(now, "month");
};

const route = useRoute();

const openCreateFromRoute = () => {
    if (route.query.create === "1") {
        isCreateLeadOpen.value = true;
    }
};

// Busca os dados para exibir na tabela quando carrega a página
const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
    const [res] = await Promise.all([leads.findAll(), loadGridPreferences()]);
    isDataLoaded.value = res;
    openCreateFromRoute();

    if (route.query.id) {
        const leadId = Number(route.query.id);
        const ok = await lead.findById(leadId);
        if (ok) {
            isViewLeadOpen.value = true;
        }
    }
});

watch(() => route.query.id, async (newId) => {
    if (newId) {
        const leadId = Number(newId);
        const ok = await lead.findById(leadId);
        if (ok) {
            isViewLeadOpen.value = true;
        }
    }
});

watch(() => route.query.create, openCreateFromRoute);
onBeforeUnmount(() => {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    window.removeEventListener("pointermove", moveColumnResize);
    window.removeEventListener("pointerup", stopColumnResize);
    window.removeEventListener("pointercancel", stopColumnResize);
    document.body.classList.remove("is-resizing-lead-column");
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
                        <h1 class="font-medium text-base text-nowrap">Leads</h1>
                        <div
                            class="hidden md:block w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <div class="hidden md:flex items-center gap-2">
                            <ElButton
                                v-if="
                                    hasUserPermission(
                                        user.permissoes,
                                        UserPermissions.CRIAR_LEAD,
                                    )
                                "
                                @click="openCreateLeadModal"
                                type="primary"
                                :icon="Plus"
                                size="small"
                            >
                                Cadastrar
                            </ElButton>
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 md:gap-4 items-center">
                        <div class="flex items-center justify-center">
                            <!-- Botão para abrir o modal de exportação -->
                            <ElTooltip
                                v-if="
                                    hasUserPermission(
                                        user.permissoes,
                                        UserPermissions.ADMIN,
                                    )
                                "
                                content="Importar / Exportar"
                                :disabled="device.isMobile"
                                placement="bottom"
                                :hide-after="0"
                                effect="light"
                            >
                                <ElButton
                                    :icon="UploadFilled"
                                    @click="openExportDataModal"
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
                            <div class="flex items-center gap-1 text-sm">
                                <ElIcon>
                                    <OfficeBuilding />
                                </ElIcon>
                                Total:
                                <span>
                                    {{
                                        formatNumber(
                                            leads.data.total.toString(),
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
                ref="leadTableRef"
                v-if="isDataLoaded && !leads.isLoading && leads.data"
                empty-text="Sem dados para exibir."
                :data="filterTableData"
                class="lead-table !grow !h-full"
                :fit="true"
                row-key="id"
                @sort-change="leads.handleSortChange"
                :row-class-name="
                    ({ row }) => (row.sem_interacao ? 'lead-row-alert' : '')
                "
            >
                <ElTableColumn v-for="column in visibleColumns" :key="column.key" :label="column.label" :prop="column.key" :min-width="column.width" :sortable="column.sortable ? 'custom' : false" :resizable="false">
                    <template #header="{ column: tableColumn }">
                        <div class="lead-column-header">
                            <span class="min-w-0 flex-1 truncate">{{ column.label }}</span>
                            <span class="lead-column-resize-handle" title="Arraste para ajustar a largura" @pointerdown="startColumnResize($event, column.key, tableColumn.id, column.width)" />
                        </div>
                    </template>
                    <template #default="scope">
                        <span v-if="column.key === 'nome_lead'" class="flex min-w-0 items-center gap-2">
                            <ElTooltip v-if="isNewLead(scope.row.criado)" :disabled="device.isMobile" content="Lead novo" placement="left" :hide-after="0" effect="light"><ElIcon class="!text-nivel"><CaretRight /></ElIcon></ElTooltip>
                            <ElTooltip v-if="scope.row.sem_interacao" content="Lead sem interação registrada" placement="top" :hide-after="0" effect="light"><ElIcon class="!text-orange-500"><WarningFilled /></ElIcon></ElTooltip>
                            <span class="truncate" :title="scope.row.nome_lead">{{ scope.row.nome_lead }}</span>
                        </span>
                        <span v-else-if="column.key === 'cpf_cnpj'" class="font-mono text-xs">{{ scope.row.cpf_cnpj ? formatCPF_CNPJ(scope.row.cpf_cnpj) : "Não informado" }}</span>
                        <template v-else-if="column.key === 'contato'"><a v-if="scope.row.contato" :href="toTel(scope.row.contato)" class="underline transition-opacity hover:opacity-70">{{ formatPhone(String(scope.row.contato)) }}</a></template>
                        <span v-else-if="column.key === 'responsavel'" class="truncate">{{ scope.row.responsavel || scope.row.contato_nome || "Não informado" }}</span>
                        <ElTag v-else-if="column.key === 'status_lead'" effect="light" :style="scope.row.status_cor ? { borderColor: scope.row.status_cor, color: scope.row.status_cor } : {}">{{ scope.row.status_lead }}</ElTag>
                        <span v-else-if="column.key === 'ultima_interacao'" :class="scope.row.sem_interacao ? 'font-medium text-orange-600' : ''">{{ formatDateTime(scope.row.ultima_interacao) }}</span>
                        <template v-else-if="column.key === 'proximo_follow_up'">{{ formatDateTime(scope.row.proximo_follow_up) }}</template>
                        <span v-else-if="column.key === 'usuario.nome'" class="truncate">{{ scope.row.usuario?.nome || "Não informado" }}</span>
                        <template v-else-if="column.key === 'origem_lead'">{{ formatOrigin(scope.row.origem_lead) }}</template>
                        <ElTag v-else-if="column.key === 'prioridade'" :type="getPriorityTag(scope.row.prioridade).type as any">{{ getPriorityTag(scope.row.prioridade).label }}</ElTag>
                        <span v-else-if="column.key === 'atividade'" class="truncate">{{ scope.row.atividade || "" }}</span>
                    </template>
                </ElTableColumn>
                <ElTableColumn
                    fixed="right"
                    width="72"
                    class-name="lead-actions-column"
                    header-cell-class-name="lead-actions-column"
                >
                    <template #default="scope">
                        <div class="w-full flex items-center gap-0">
                            <ElTooltip
                                :disabled="device.isMobile"
                                content="Visualizar"
                                placement="bottom"
                                effect="light"
                                :hide-after="0"
                            >
                                <ElButton
                                    @click="handleView(scope.row)"
                                    class="lead-view-button !w-full md:!w-fit"
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
                <LeadFilterOptions />
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
                        @current-change="leads.handlePageChange"
                        :current-page.sync="leads.page"
                        layout="prev, pager, next"
                        :page-size="leads.perPage"
                        :total="leads.data.total"
                    />
                </template>
            </ElSkeleton>
        </div>

        <!-- Botão para abrir o menu de cadastro MOBILE -->
        <div
            class="flex md:hidden items-center justify-center fixed bottom-0 right-0 mb-20 mr-4 z-10"
            v-if="
                hasUserPermission(user.permissoes, UserPermissions.CRIAR_LEAD)
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
                        @click="openCreateLeadModal"
                        :circle="true"
                        type="primary"
                        :icon="Plus"
                        size="large"
                    />
                </template>
            </ElSkeleton>
        </div>

        <!-- Modal de exportação -->
        <LeadDataMenu
            v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
            v-model="isExportDataOpen"
        />

        <!-- Modal de criação -->
        <LeadCreateModal
            v-if="
                hasUserPermission(user.permissoes, UserPermissions.CRIAR_LEAD)
            "
            v-model="isCreateLeadOpen"
            :initial-data="pendingLeadDraft"
            @prefill-applied="pendingLeadDraft = null"
        />

        <!-- Modal de visualização -->
        <LeadViewModal v-model="isViewLeadOpen" />
    </div>
</template>

<style scoped>
.el-table__body-wrapper .el-scrollbar__wrap,
.el-table__body-wrapper .el-scrollbar__wrap .el-scrollbar__view {
    height: 100% !important;
    width: 100% !important;
}

:deep(.lead-row-alert) {
    --el-table-tr-bg-color: rgba(245, 158, 11, 0.08);
    --lead-alert-actions-bg: rgb(254, 248, 237);
}

:deep(.lead-table td.lead-actions-column),
:deep(.lead-table th.lead-actions-column) {
    background-color: #ffffff !important;
    box-shadow: -10px 0 14px -14px rgba(0, 0, 0, 0.45) inset;
}

:deep(.lead-table .el-table__row:hover td.lead-actions-column) {
    background-color: #f5f7fa !important;
}

:deep(.lead-table .lead-row-alert td.lead-actions-column) {
    background-color: rgb(254, 248, 237) !important;
}

:global(html.dark .lead-table td.lead-actions-column),
:global(html.dark .lead-table th.lead-actions-column) {
    background-color: #191919 !important;
    box-shadow: -10px 0 14px -14px rgba(255, 255, 255, 0.25) inset;
}

:global(html.dark .lead-table .lead-row-alert) {
    --lead-alert-actions-bg: rgba(245, 158, 11, 0.12);
}

:global(html.dark .lead-table .el-table__row:hover td.lead-actions-column) {
    background-color: #262626 !important;
}

:global(html.dark .lead-table .lead-row-alert td.lead-actions-column) {
    background-color: #352915 !important;
}

:deep(.lead-actions-column .cell) {
    display: flex;
    justify-content: center;
    overflow: hidden;
    padding-left: 8px;
    padding-right: 8px;
}

:deep(.lead-column-header) {
    position: static;
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    align-items: center;
}

:deep(.lead-table .el-table__header th:not(.lead-actions-column) > .cell) {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: visible;
}

:deep(.lead-table .el-table__header th .caret-wrapper) {
    flex: 0 0 auto;
    margin-left: 4px;
}

:deep(.lead-column-resize-handle) {
    position: absolute;
    z-index: 3;
    top: -12px;
    right: -4px;
    bottom: -12px;
    width: 10px;
    cursor: col-resize;
    touch-action: none;
}

:deep(.lead-column-resize-handle:hover)::after {
    content: "";
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 5px;
    width: 2px;
    border-radius: 9999px;
    background: var(--el-color-primary);
}

:global(body.is-resizing-lead-column),
:global(body.is-resizing-lead-column *) {
    cursor: col-resize !important;
    user-select: none !important;
}


</style>
