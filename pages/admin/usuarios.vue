<script setup lang="ts">
import {
    Plus,
    OfficeBuilding,
    Folder,
    Filter,
    Loading,
} from "@element-plus/icons-vue";

definePageMeta({
    requiredModule: Modules.CRM,
    requiredPermission: UserPermissions.VER_USUARIO,
});

const { user } = useAuthSession();
const usuarios = useUsuarios();
const usuario = useUsuario();
const device = useDevice();
const route = useRoute();
const isCreateUsuarioOpen = ref(false);
const isViewUsuarioOpen = ref(false);

// Para abrir e fechar o filtro de pesquisa
const filterMenu = ref<boolean>(false);
const toggleFilterMenu = () => (filterMenu.value = !filterMenu.value);

// Filtra os dados da tabela para exibir apenas as 100 dados
const filterTableData = computed(() => usuarios.data.data?.slice(0, 100));
const getUsuarioRowClass = (scope: {
    row: { desativado?: boolean; empresa?: { desativado?: boolean } };
}) => {
    const isInativo = scope.row.desativado || scope.row.empresa?.desativado;
    return isInativo ? "usuario-row-inativo" : "usuario-row-ativo";
};
// Abre o modal de criação
const openCreateUsuarioModal = () => (isCreateUsuarioOpen.value = true);

// Abre o modal de visualização
const handleView = async (row: { id: number }) => {
    usuario.findById(row.id);
    isViewUsuarioOpen.value = true;
};

// Busca os dados para exibir na tabela quando carrega a página
const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
    const res = await usuarios.findAll();
    isDataLoaded.value = res;
    const usuarioId = Number(route.query.id || 0);
    if (usuarioId) await handleView({ id: usuarioId });
});

watch(
    () => route.query.id,
    async (id) => {
        const usuarioId = Number(id || 0);
        if (usuarioId && usuarioId !== usuario.data?.id)
            await handleView({ id: usuarioId });
    },
);
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
                            Usuários
                        </h1>
                        <div
                            class="hidden md:block w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <div class="hidden md:flex items-center gap-2">
                            <ElButton
                                v-if="
                                    hasUserPermission(
                                        user.permissoes,
                                        UserPermissions.CRIAR_USUARIO,
                                    )
                                "
                                @click="openCreateUsuarioModal"
                                type="primary"
                                :icon="Plus"
                                size="small"
                            >
                                Cadastrar
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
                                    <OfficeBuilding />
                                </ElIcon>
                                Total:
                                <span>
                                    {{
                                        formatNumber(
                                            usuarios.data.total.toString(),
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
                v-if="isDataLoaded && !usuarios.isLoading && usuarios.data"
                empty-text="Sem dados para exibir."
                :data="filterTableData"
                :row-class-name="getUsuarioRowClass"
                class="!grow !h-full"
            >
                <ElTableColumn label="Usuário" prop="nome">
                    <template #default="scope">
                        <div class="flex items-center gap-2 min-w-0">
                            <ElAvatar
                                size="small"
                                class="!text-black dark:!text-white !font-semibold"
                                :src="parserAvatar(scope.row.avatar)"
                            >
                                <span class="uppercase font-medium text-xs">
                                    {{ scope.row.nome?.slice(0, 1) || "U" }}
                                </span>
                            </ElAvatar>
                            <span class="truncate"> {{ scope.row.nome }}</span>
                        </div>
                    </template>
                </ElTableColumn>
                <ElTableColumn
                    label="Presença"
                    prop="online"
                    min-width="120"
                    width="120"
                >
                    <template #default="scope">
                        <ElTag
                            size="small"
                            effect="dark"
                            :type="scope.row.online ? 'success' : 'info'"
                            :class="
                                scope.row.online
                                    ? '!bg-green-500 !border-green-500 !text-white'
                                    : '!bg-gray-500 !border-gray-500 !text-white'
                            "
                            disable-transitions
                        >
                            <span class="font-medium">
                                {{ scope.row.online ? "Online" : "Offline" }}
                            </span>
                        </ElTag>
                    </template>
                </ElTableColumn>
                <ElTableColumn>
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
                <UsuarioFilterOptions />
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
                        @current-change="usuarios.handlePageChange"
                        :current-page.sync="usuarios.page"
                        :page-size="usuarios.perPage"
                        :total="usuarios.data.total"
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
                    user.permissoes,
                    UserPermissions.CRIAR_USUARIO,
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
                        @click="openCreateUsuarioModal"
                        :circle="true"
                        type="primary"
                        :icon="Plus"
                        size="large"
                    />
                </template>
            </ElSkeleton>
        </div>

        <!-- Modal de criação -->
        <UsuarioCreateModal
            v-if="
                hasUserPermission(
                    user.permissoes,
                    UserPermissions.CRIAR_USUARIO,
                )
            "
            v-model="isCreateUsuarioOpen"
        />

        <!-- Modal de visualização -->
        <UsuarioViewModal v-model="isViewUsuarioOpen" />
    </div>
</template>

<style scoped>
.el-table__body-wrapper .el-scrollbar__wrap,
.el-table__body-wrapper .el-scrollbar__wrap .el-scrollbar__view {
    height: 100% !important;
    width: 100% !important;
}

:deep(.el-table .usuario-row-ativo > td.el-table__cell:first-child) {
    border-left: 3px solid #79fe96 !important;
}

:deep(.el-table .usuario-row-inativo > td.el-table__cell:first-child) {
    border-left: 3px solid #dc2626 !important;
}
</style>
