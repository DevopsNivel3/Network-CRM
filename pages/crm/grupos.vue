<script setup lang="ts">
import {
    Plus,
    OfficeBuilding,
    Filter,
    Loading,
    Folder,
} from "@element-plus/icons-vue";

definePageMeta({
    requiredModule: Modules.CRM,
    requiredPermission: UserPermissions.VER_GRUPO,
});

const { user } = useAuthSession();
const device = useDevice();
const leadGroups = useLeadGroups();

const filterMenu = ref<boolean>(false);
const toggleFilterMenu = () => (filterMenu.value = !filterMenu.value);

const isCreateOpen = ref<boolean>(false);
const isViewOpen = ref<boolean>(false);
const isEditOpen = ref<boolean>(false);
const selectedGroup = ref<{
    id: number;
    nome: string;
    descricao: string | null;
    criado?: string;
    atualizado?: string;
    usuario?: {
        id: number;
        nome: string;
    } | null;
} | null>(null);

const openCreateModal = () => (isCreateOpen.value = true);
const openViewModal = (group: {
    id: number;
    nome: string;
    descricao: string | null;
    criado?: string;
    atualizado?: string;
    usuario?: {
        id: number;
        nome: string;
    } | null;
}) => {
    selectedGroup.value = group;
    isViewOpen.value = true;
};
const openEditModal = (group: {
    id: number;
    nome: string;
    descricao: string | null;
    criado?: string;
    atualizado?: string;
    usuario?: {
        id: number;
        nome: string;
    } | null;
}) => {
    selectedGroup.value = group;
    isEditOpen.value = true;
};

const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
    const res = await leadGroups.findAll();
    isDataLoaded.value = res;
});

const canCreate = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.CRIAR_GRUPO),
);
const canEdit = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.EDITAR_GRUPO),
);
const canDelete = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.DELETAR_GRUPO),
);

const syncSelectedGroupFromStore = () => {
    if (!selectedGroup.value?.id) return;

    const updatedGroup = (leadGroups.data.data || []).find(
        (item) => item.id === selectedGroup.value?.id,
    );

    if (updatedGroup) selectedGroup.value = updatedGroup;
    else {
        selectedGroup.value = null;
        isViewOpen.value = false;
    }
};

const handleUpdatedGroup = () => syncSelectedGroupFromStore();

watch(
    () => leadGroups.data.data,
    () => {
        syncSelectedGroupFromStore();
    },
    { deep: true },
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
                            Grupos
                        </h1>
                        <div
                            class="hidden md:block w-[0.5px] h-6 bg-black/15 dark:bg-white/15"
                        />
                        <div class="hidden md:flex items-center gap-2">
                            <ElButton
                                v-if="canCreate"
                                @click="openCreateModal"
                                type="primary"
                                :icon="Plus"
                                size="small"
                            >
                                Cadastrar
                            </ElButton>
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 md:gap-4 items-center">
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
                        <ElButton>
                            <div class="flex items-center gap-1 text-sm">
                                <ElIcon>
                                    <OfficeBuilding />
                                </ElIcon>
                                Total:
                                <span>{{
                                    formatNumber(
                                        leadGroups.data.total.toString(),
                                    )
                                }}</span>
                            </div>
                        </ElButton>
                    </div>
                </template>
            </ElSkeleton>
        </div>

        <ElScrollbar view-class="!h-full !w-full">
            <ElTable
                v-if="isDataLoaded && !leadGroups.isLoading"
                empty-text="Sem dados para exibir."
                :data="leadGroups.data.data || []"
                class="!grow !h-full"
            >
                <ElTableColumn label="Nome" prop="nome">
                    <template #default="scope">
                        <span class="truncate"> {{ scope.row.nome }}</span>
                    </template>
                </ElTableColumn>
                <ElTableColumn>
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
                                    @click="openViewModal(scope.row)"
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

            <div
                class="absolute bg-neutral-50 top-0 bottom-0 right-0 w-full max-w-[300px] !z-20 border-l-[0.5px] dark:border-white/15 dark:bg-eerie"
                v-show="filterMenu"
            >
                <LeadGroupFilterOptions />
            </div>
        </ElScrollbar>

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
                        @current-change="leadGroups.handlePageChange"
                        :current-page.sync="leadGroups.page"
                        :page-size="leadGroups.perPage"
                        :total="leadGroups.data.total"
                        layout="prev, pager, next"
                    />
                </template>
            </ElSkeleton>
        </div>

        <div
            class="flex md:hidden items-center justify-center fixed bottom-0 right-0 mb-20 mr-4 z-10"
            v-if="canCreate"
        >
            <ElButton
                @click="openCreateModal"
                :circle="true"
                type="primary"
                :icon="Plus"
                size="large"
            />
        </div>

        <LeadGroupCreateModal
            v-model="isCreateOpen"
            @created="syncSelectedGroupFromStore"
        />
        <LeadGroupViewModal
            v-model="isViewOpen"
            :group="selectedGroup"
            :can-edit="canEdit"
            :can-delete="canDelete"
            @edit="openEditModal"
            @deleted="syncSelectedGroupFromStore"
        />
        <LeadGroupEditModal
            v-model="isEditOpen"
            :group="selectedGroup"
            @updated="handleUpdatedGroup"
        />
    </div>
</template>
