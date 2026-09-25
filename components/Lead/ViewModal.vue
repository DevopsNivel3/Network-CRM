<script setup lang="ts">
import { Edit, Delete, Loading, Close } from "@element-plus/icons-vue";
import type { TabsPaneContext } from "element-plus";

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
const leads = useLeads();
const lead = useLead();
const oportunidade = useOportunidade();
const oportunidades = useOportunidades();
const isEditOpen = ref(false);
const isViewOportunidadeOpen = ref(false);
const isCreateOportunidadeOpen = ref(false);
const canEditLead = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.EDITAR_LEAD),
);
const canDeleteLead = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.DELETAR_LEAD),
);
const canSeeOportunidades = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.VER_OPORTUNIDADE),
);
const canCreateOportunidade = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.CRIAR_OPORTUNIDADE),
);

const handleEdit = async () => {
    isEditOpen.value = true;
};

const handleDelete = async () => {
    if (!lead.data?.id) return;

    try {
        ElMessageBox.confirm(
            h("p", null, [
                h("span", null, "Observações: "),
                h(
                    "li",
                    { class: "text-xs" },
                    "Ao remover o Lead, todos os dados serão perdidos.",
                ),
                h(
                    "li",
                    { class: "text-xs" },
                    "Isso inclui oportunidades e localizações vinculadas.",
                ),
                h("br", null),
                h(
                    "span",
                    null,
                    `Você excluirá permanentemente o Lead ${lead.data.nome_lead}. Deseja continuar?`,
                ),
            ]),
            "Atenção",
            {
                confirmButtonClass:
                    "!bg-red-400 hover:!bg-red-400/60 !transition-colors !text-white !border-none",
                confirmButtonText: "Sim, deletar!",
                cancelButtonText: "Cancelar",
                type: "warning",
            },
        ).then(async () => {
            const isLeadDeleted = await lead.deleteById(lead.data!.id);

            if (isLeadDeleted) {
                ElMessage.success({
                    message: "Lead deletado com sucesso!",
                    type: "success",
                    plain: true,
                });

                leads.removeLeadFromState(lead.data!.id);
                closeViewModal();
            }
        });
    } catch (err) {
        console.error(err);
    }
};

// Fecha o modal de visualização
const closeViewModal = () => {
    activePaneName.value = "info";
    lead.resetOportunidades();
    isOpen.value = false;
};

const viewTitle = computed(() =>
    lead.data?.id
        ? `Visualizando Lead - #${lead.data.id}`
        : "Visualizando Lead",
);

// Ações para executar ao mudar de painel
const activePaneName = ref<string>("info");
const handlePaneClick = async (tab: TabsPaneContext) => {
    if (tab.paneName?.toString() === "oportunidades" && lead.data?.id) {
        await lead.fetchOportunidades(lead.data.id, 1);
    }
    if (tab.paneName?.toString() === "observacoes" && lead.data?.id) {
        await lead.fetchComments(lead.data.id, 1);
    }
};

const openOportunidadeView = async (id: number) => {
    if (!canSeeOportunidades.value) return;
    const isLoaded = await oportunidade.findById(id);
    if (!isLoaded) return;
    isViewOportunidadeOpen.value = true;
};

const openOportunidadeCreate = async () => {
    if (!lead.data?.id || !canCreateOportunidade.value) return;
    const isBoardsLoaded = await oportunidades.findAllBoards();
    if (!isBoardsLoaded) return;
    isCreateOportunidadeOpen.value = true;
};

const route = useRoute();
watch(
    () => isOpen.value,
    async (isOpen) => {
        if (!isOpen) return;

        if (route.query.tab) {
            const targetTab = route.query.tab as string;
            activePaneName.value = targetTab;
            
            if (targetTab === "oportunidades" && lead.data?.id) {
                await lead.fetchOportunidades(lead.data.id, 1);
            }
            if (targetTab === "observacoes" && lead.data?.id) {
                await lead.fetchComments(lead.data.id, 1);
            }
        }
    }
);
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[1500px]"
        v-model="isOpen"
        title="Visualizando Lead"
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
                        v-if="canEditLead && !lead.isLoading"
                        :disabled="lead.isSubmitting"
                        @click="handleEdit"
                        type="primary"
                        :icon="Edit"
                    >
                        Editar
                    </ElButton>
                    <ElButton
                        v-if="canDeleteLead && !lead.isLoading"
                        :disabled="lead.isSubmitting"
                        @click="handleDelete"
                        type="danger"
                        :icon="Delete"
                    >
                        Excluir
                    </ElButton>
                </template>
            </UIDialogHeader>
        </template>
        <div class="flex flex-col w-full" v-if="!lead.isLoading">
            <div class="flex flex-col-reverse md:flex-row w-full">
                <!-- Quadro de Informações -->
                <div
                    class="md:min-w-[230px] md:max-w-[230px] border-y-[0.5px] md:rounded-r-[4px] md:border-r-[0.5px] border-y-black/10 md:border-r-black/10 dark:border-y-white/10 dark:md:border-r-white/10 md:mr-4 !h-[calc(100vh-200px)] !min-h-[520px]"
                >
                    <LeadSidebarInfo />
                </div>
                <div class="flex flex-col gap-4 w-full !break-all">
                    <!-- Paineis -->
                    <ElTabs
                        class="lead-tabs !h-[calc(100vh-200px)] !min-h-[520px] !bg-transparent !border-[0.5px] !p-0 !border-black/10 dark:!border-white/10 !rounded"
                        v-model="activePaneName"
                        @tab-click="handlePaneClick"
                        type="border-card"
                    >
                        <!-- Painel de Informações -->
                        <ElTabPane
                            label="Dados"
                            name="info"
                            class="flex flex-col gap-2 h-full"
                        >
                            <LeadTabsDados />
                        </ElTabPane>
                        <!-- Observações -->
                        <ElTabPane
                            v-if="canSeeOportunidades"
                            label="Oportunidades"
                            name="oportunidades"
                            class="flex flex-col gap-2 h-full"
                        >
                            <LeadTabsOportunidades
                                v-if="activePaneName === 'oportunidades'"
                                @open-view="openOportunidadeView"
                                @open-create="openOportunidadeCreate"
                            />
                        </ElTabPane>
                        <ElTabPane
                            label="Observações"
                            name="observacoes"
                            class="flex flex-col gap-2 h-full"
                        >
                            <LeadTabsObservation
                                v-if="activePaneName === 'observacoes'"
                            />
                        </ElTabPane>
                    </ElTabs>
                </div>
            </div>
        </div>
        <!-- Tela de Carregamento -->
        <div
            v-if="lead.isLoading"
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
    <!-- Modal de edição de lead -->
    <LeadEditModal
        v-if="hasUserPermission(user.permissoes, UserPermissions.EDITAR_LEAD)"
        v-model="isEditOpen"
    />
    <OportunidadeCreateModal
        v-if="canCreateOportunidade"
        v-model="isCreateOportunidadeOpen"
        :lead-id="lead.data?.id ?? null"
    />
    <OportunidadeViewModal v-model="isViewOportunidadeOpen" />
</template>

<style scoped>
:deep(.el-tabs__content) {
    padding: 0 !important;
}

:deep(.el-tab-pane) {
    padding: 0 !important;
}
</style>
