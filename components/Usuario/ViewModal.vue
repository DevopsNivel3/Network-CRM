<script setup lang="ts">
import { Edit, Loading } from "@element-plus/icons-vue";

const { user: userAuth } = useAuthSession();
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
const usuario = useUsuario();
const isEditOpen = ref(false);

// Abre o modal de edição
const openEditModal = () => (isEditOpen.value = true);

// Fecha o modal de visualização
const closeViewDialog = () => {
    activePaneName.value = "info";
    isOpen.value = false;
};

const viewTitle = computed(() =>
    usuario.data?.id
        ? `Visualizando Usuário - #${usuario.data.id}`
        : "Visualizando Usuário",
);

// Ações para executar ao mudar de painel
const activePaneName = ref<string>("info");
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[1000px]"
        v-model="isOpen"
        title="Visualizando Usuário"
        @close="closeViewDialog"
        destroy-on-close
        :z-index="1500"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader :title="viewTitle" @close="closeViewDialog">
                <template #actions>
                    <ElButton
                        v-if="
                            !!usuario.data &&
                            !usuario.isLoading &&
                            hasUserPermission(
                                userAuth.permissoes,
                                UserPermissions.EDITAR_USUARIO,
                            ) &&
                            (!hasUserPermission(
                                Number(usuario.data?.permissoes),
                                UserPermissions.ADMIN,
                            ) ||
                                hasUserPermission(
                                    userAuth.permissoes,
                                    UserPermissions.ADMIN,
                                )) &&
                            (!hasUserPermission(
                                Number(usuario.data?.permissoes),
                                UserPermissions.ADMIN,
                            ) ||
                                hasUserPermission(
                                    userAuth.permissoes,
                                    UserPermissions.ADMIN,
                                ))
                        "
                        :disabled="usuario.isSubmitting"
                        @click="openEditModal"
                        type="primary"
                        :icon="Edit"
                    >
                        Editar
                    </ElButton>
                </template>
            </UIDialogHeader>
        </template>
        <div
            class="flex flex-col-reverse md:flex-row w-full"
            v-if="!usuario.isLoading"
        >
            <!-- Quadro de Informações -->
            <div
                class="md:min-w-[230px] md:max-w-[230px] border-y-[0.5px] md:rounded-r-[4px] md:border-r-[0.5px] border-y-black/10 dark:border-y-white/10 md:border-r-black/10 dark:md:border-r-white/10 md:mr-4 !h-[calc(100vh-200px)] !min-h-[520px]"
            >
                <UsuarioSidebarInfo />
            </div>
            <div class="flex min-w-0 flex-col gap-4 w-full">
                <!-- Paineis -->
                <ElTabs
                    class="lead-tabs !h-[calc(100vh-200px)] !min-h-[520px] !bg-transparent !border-[0.5px] !p-0 !border-black/10 dark:!border-white/10 !rounded"
                    v-model="activePaneName"
                    type="border-card"
                >
                    <!-- Painel de Informações -->
                    <ElTabPane
                        label="Dados"
                        name="info"
                        class="flex flex-col gap-2 h-full"
                    >
                        <UsuarioTabsDados />
                    </ElTabPane>
                    <ElTabPane
                        label="Permissões"
                        name="permissoes"
                        class="flex flex-col gap-2 h-full"
                    >
                        <UsuarioTabsPermissoes />
                    </ElTabPane>
                    <ElTabPane
                        v-if="
                            hasUserPermission(
                                userAuth.permissoes,
                                UserPermissions.ADMIN,
                            )
                        "
                        label="Auditoria"
                        name="logs"
                        class="h-full"
                        lazy
                    >
                        <UsuarioTabsLogs />
                    </ElTabPane>
                </ElTabs>
            </div>
        </div>
        <!-- Tela de carregamento -->
        <div
            v-if="usuario.isLoading"
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
    <!-- Modal de edição -->
    <UsuarioEditModal
        v-if="
            hasUserPermission(
                userAuth.permissoes,
                UserPermissions.EDITAR_USUARIO,
            )
        "
        v-model="isEditOpen"
    />
</template>

<style scoped>
:deep(.el-tabs__content) {
    padding: 0 !important;
    height: calc(100% - 40px);
    overflow: hidden;
}

:deep(.el-tab-pane) {
    padding: 0 !important;
}
</style>
