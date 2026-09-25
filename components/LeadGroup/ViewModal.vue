<script setup lang="ts">
import { Delete, Edit } from "@element-plus/icons-vue";

interface LeadGroupData {
    id: number;
    nome: string;
    descricao: string | null;
    criado?: string;
    atualizado?: string;
    usuario?: {
        id: number;
        nome: string;
    } | null;
}

const props = defineProps<{
    modelValue: boolean;
    group: LeadGroupData | null;
    canEdit: boolean;
    canDelete: boolean;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: boolean];
    edit: [group: LeadGroupData];
    deleted: [void];
}>();

const leadGroups = useLeadGroups();
const activePaneName = ref("dados");

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const closeDialog = () => {
    activePaneName.value = "dados";
    isOpen.value = false;
};

const handleEdit = () => {
    if (!props.group || !props.canEdit) return;
    emit("edit", props.group);
};

const viewTitle = computed(() =>
    props.group?.id
        ? `Visualizando Grupo - #${props.group.id}`
        : "Visualizando Grupo",
);

const handleDelete = async () => {
    if (!props.group || !props.canDelete) return;

    ElMessageBox.confirm(
        `Você excluirá permanentemente o grupo ${props.group.nome}. Deseja continuar?`,
        "Atenção",
        {
            confirmButtonClass:
                "!bg-red-400 hover:!bg-red-400/60 !transition-colors !text-white !border-none",
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar",
            type: "warning",
        },
    ).then(async () => {
        const ok = await leadGroups.remove(props.group!.id);
        if (!ok) return;

        ElMessage.success({
            message: "Grupo deletado com sucesso!",
            type: "success",
            plain: true,
        });
        emit("deleted");
        closeDialog();
    });
};
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[900px]"
        v-model="isOpen"
        :title="viewTitle"
        :show-close="false"
        destroy-on-close
        :z-index="1500"
        align-center
        @close="closeDialog"
    >
        <template #header>
            <UIDialogHeader :title="viewTitle" @close="closeDialog">
                <template #actions>
                    <ElButton
                        v-if="props.canEdit"
                        type="primary"
                        :icon="Edit"
                        @click="handleEdit"
                    >
                        Editar
                    </ElButton>
                    <ElButton
                        v-if="props.canDelete"
                        type="danger"
                        :icon="Delete"
                        :disabled="leadGroups.isSubmitting"
                        @click="handleDelete"
                    >
                        Excluir
                    </ElButton>
                </template>
            </UIDialogHeader>
        </template>

        <div
            class="flex flex-col-reverse md:flex-row w-full"
            v-if="props.group"
        >
            <div
                class="md:min-w-[230px] md:max-w-[230px] border-y-[0.5px] md:rounded-r-[4px] md:border-r-[0.5px] border-y-black/10 dark:border-y-white/10 md:border-r-black/10 dark:md:border-r-white/10 md:mr-4 !h-[calc(100vh-200px)] !min-h-[520px]"
            >
                <LeadGroupSidebarInfo :group="props.group" />
            </div>

            <div class="flex flex-col gap-4 w-full !break-all">
                <ElTabs
                    class="!h-[calc(100vh-200px)] !min-h-[520px] !bg-transparent !border-[0.5px] !p-0 !border-black/10 dark:!border-white/10 !rounded"
                    v-model="activePaneName"
                    type="border-card"
                >
                    <ElTabPane label="Dados" name="dados">
                        <LeadGroupTabsDados :group="props.group" />
                    </ElTabPane>
                </ElTabs>
            </div>
        </div>
    </ElDialog>
</template>

<style scoped>
:deep(.el-tabs__content) {
    padding: 0 !important;
}

:deep(.el-tab-pane) {
    padding: 0 !important;
}
</style>
