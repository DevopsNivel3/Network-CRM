<script setup lang="ts">
import { Edit, Loading } from "@element-plus/icons-vue";
import type { TabsPaneContext } from "element-plus";

const oportunidade = useOportunidade();
const oportunidades = useOportunidades();
const { user } = useAuthSession();
const props = defineProps<{
    modelValue: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});
const isEditOpen = ref(false);
const isCreateVisitaOpen = ref(false);
const isViewVisitaOpen = ref(false);
const canEditOportunidade = computed(
    () =>
        hasUserPermission(
            user.permissoes,
            UserPermissions.EDITAR_OPORTUNIDADE,
        ) ||
        !!oportunidade.data?.responsavel_atual?.pode_editar ||
        !!oportunidade.data?.responsavel_atual?.principal,
);
const canSeeInteracoes = computed(
    () =>
        hasUserPermission(user.permissoes, UserPermissions.VER_OPORTUNIDADE) ||
        !!oportunidade.data?.responsavel_atual?.pode_interacoes ||
        !!oportunidade.data?.responsavel_atual?.principal,
);
const canSeeVisitas = computed(
    () =>
        hasUserPermission(user.permissoes, UserPermissions.VER_VISITA) ||
        !!oportunidade.data?.responsavel_atual?.pode_visitas ||
        !!oportunidade.data?.responsavel_atual?.principal,
);
const canCreateVisitas = computed(
    () =>
        !!oportunidade.data?.responsavel_atual?.pode_visitas ||
        !!oportunidade.data?.responsavel_atual?.principal,
);

// Abre o modal de editar a oportunidade
const handleEdit = () => (isEditOpen.value = true);

const handleToggleDisabled = async () => {
    if (!oportunidade.data?.id) return;
    const isDisabled = !!oportunidade.data?.desativado;
    const actionLabel = isDisabled ? "reativar" : "desativar";

    try {
        await ElMessageBox.confirm(
            `Deseja ${actionLabel} esta oportunidade?`,
            "Atenção",
            {
                confirmButtonText: `Sim, ${actionLabel}!`,
                cancelButtonText: "Cancelar",
                type: "warning",
            },
        );

        const ok = await oportunidade.updateById(oportunidade.data.id, {
            desativado: !isDisabled,
        });
        if (ok) {
            await oportunidades.findAll();
            closeViewModal();
        }
    } catch {
        // cancelado
    }
};

// Dados do responsáveis pela Oportunidade

// Fecha o modal de visualização
const closeViewModal = () => {
    activePaneName.value = "info";
    isOpen.value = false;
};

const viewTitle = computed(() =>
    oportunidade.data?.id
        ? `Visualizando Oportunidade - #${oportunidade.data.id}`
        : "Visualizando Oportunidade",
);

// Ações para executar ao mudar de painel
const activePaneName = ref<string>("info");
const handlePaneClick = async (tab: TabsPaneContext) => {
    if (tab.paneName?.toString() === "interacoes" && oportunidade.data?.id) {
        await oportunidade.findAllInteracoes(oportunidade.data.id, 1);
    }
    if (tab.paneName?.toString() === "visitas" && oportunidade.data?.id) {
        await oportunidade.fetchVisitas(oportunidade.data.id);
    }
    if (tab.paneName?.toString() === "observacoes" && oportunidade.data?.id) {
        await oportunidade.fetchComments(oportunidade.data.id, 1);
    }
};

// Reseta os dados sempre que fecha o modal de visualizar
const route = useRoute();
watch(
    () => isOpen.value,
    async (isOpen) => {
        if (!isOpen) {
            oportunidade.resetData();
            return;
        }

        if (route.query.tab) {
            const targetTab = route.query.tab as string;
            activePaneName.value = targetTab;
            // Carrega os dados da aba automaticamente
            if (targetTab === "interacoes" && oportunidade.data?.id) {
                await oportunidade.findAllInteracoes(oportunidade.data.id, 1);
            }
            if (targetTab === "visitas" && oportunidade.data?.id) {
                await oportunidade.fetchVisitas(oportunidade.data.id);
            }
            if (targetTab === "observacoes" && oportunidade.data?.id) {
                await oportunidade.fetchComments(oportunidade.data.id, 1);
            }
        }
    },
);
</script>

<template>
    <ElDialog
        v-model="isOpen"
        title="Visualizando Oportunidade"
        class="!w-full md:!w-[900px]"
        @close="closeViewModal"
        destroy-on-close
        :z-index="1500"
        align-center
        :show-close="false"
    >
        <template #header>
            <UIDialogHeader :title="viewTitle" @close="closeViewModal">
                <template #actions>
                    <ElButton
                        v-if="canEditOportunidade && !oportunidade.isLoading"
                        :disabled="oportunidade.isSubmitting"
                        @click="handleEdit"
                        type="primary"
                        :icon="Edit"
                    >
                        Editar
                    </ElButton>
                    <ElButton
                        v-if="canEditOportunidade && !oportunidade.isLoading"
                        :disabled="oportunidade.isSubmitting"
                        @click="handleToggleDisabled"
                        type="warning"
                    >
                        {{
                            oportunidade.data?.desativado
                                ? "Reativar"
                                : "Inativar"
                        }}
                    </ElButton>
                </template>
            </UIDialogHeader>
        </template>
        <div v-if="!oportunidade.isLoading">
            <div class="flex flex-col-reverse md:flex-row w-full">
                <!-- Quadro de Informações -->
                <div
                    class="md:min-w-[200px] md:max-w-[200px] border-y-[0.5px] md:rounded-r-[4px] md:border-r-[0.5px] border-y-black/10 md:border-r-black/10 dark:border-y-white/10 dark:md:border-r-white/10 md:mr-4 !h-[calc(100vh-200px)] !min-h-[520px]"
                >
                    <OportunidadeSidebarInfo />
                </div>
                <div class="flex flex-col gap-4 w-full !break-all">
                    <!-- Paineis -->
                    <ElTabs
                        class="!h-[calc(100vh-200px)] !min-h-[520px] !bg-transparent !border-[0.5px] !p-0 !border-black/10 dark:!border-white/10 !rounded"
                        @tab-click="handlePaneClick"
                        v-model="activePaneName"
                        type="border-card"
                    >
                        <!-- Painel de Informações -->
                        <ElTabPane
                            label="Dados"
                            name="info"
                            class="flex flex-col gap-2 h-full"
                        >
                            <OportunidadeTabsDados />
                        </ElTabPane>
                        <!-- Painel de Visitas -->
                        <ElTabPane
                            v-if="canSeeVisitas"
                            label="Visitas"
                            name="visitas"
                            class="flex flex-col gap-2 h-full"
                        >
                            <OportunidadeTabsVisitas
                                @open-create-visita="isCreateVisitaOpen = true"
                                @open-view-visita="isViewVisitaOpen = true"
                            />
                        </ElTabPane>
                        <!-- Painel de Interações -->
                        <ElTabPane
                            v-if="canSeeInteracoes"
                            label="Interações"
                            name="interacoes"
                            class="flex flex-col gap-2 h-full"
                        >
                            <OportunidadeTabsInteracoes />
                        </ElTabPane>
                        <ElTabPane
                            label="Observações"
                            name="observacoes"
                            class="flex flex-col gap-2 h-full"
                        >
                            <OportunidadeTabsObservation
                                v-if="activePaneName === 'observacoes'"
                            />
                        </ElTabPane>
                    </ElTabs>
                </div>
            </div>
        </div>
        <!-- Tela de Carregamento -->
        <div
            v-if="oportunidade.isLoading"
            class="flex items-center justify-center w-full !h-[calc(100vh-200px)] !min-h-[520px]"
        >
            <ElIcon
                class="is-loading"
                color="var(--el-color-primary)"
                size="25"
            >
                <Loading />
            </ElIcon>
        </div>
    </ElDialog>
    <!-- Modal de Edição da oportunidade -->
    <OportunidadeEditModal v-if="canEditOportunidade" v-model="isEditOpen" />
    <!-- Modal de Criação da visita -->
    <VisitaCreateModal v-if="canCreateVisitas" v-model="isCreateVisitaOpen" />
    <!-- Modal de visualização da visita -->
    <VisitaViewModal
        v-if="hasUserPermission(user.permissoes, UserPermissions.VER_VISITA)"
        v-model="isViewVisitaOpen"
    />
</template>

<style scoped>
:deep(.el-tabs__content) {
    padding: 0 !important;
}

:deep(.el-tab-pane) {
    padding: 0 !important;
}
</style>
