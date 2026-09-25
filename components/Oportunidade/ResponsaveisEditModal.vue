<script setup lang="ts">
const isOpen = defineModel<boolean>("isOpen");

const oportunidade = useOportunidade();
const usuarios = useUsuarios();
const { user } = useAuthSession();

import pkg from "lodash";
const { debounce } = pkg;
import {
    MoreFilled,
    Delete,
    Loading,
    Plus,
    StarFilled,
} from "@element-plus/icons-vue";

interface TransferOption {
    key: number;
    label: string;
    disabled: boolean;
    avatar?: string | null;
}

const isSyncing = ref(false);
const selectedToAdd = ref<number[]>([]);
const selectedToRemove = ref<number[]>([]);
const searchQuery = ref("");
const isInitialLoading = ref(false);
const isUsersInitialLoading = ref(false);
const isSettingPrincipal = ref(false);
const canManageResponsaveis = computed(
    () =>
        hasUserPermission(
            user.permissoes,
            UserPermissions.GERENCIAR_RESPONSAVEIS,
        ) || !!oportunidade.data?.responsavel_atual?.gerencia_responsaveis,
);

const permissaoOptions = [
    { value: "pode_editar", label: "Editar" },
    { value: "pode_interacoes", label: "Interações" },
    { value: "pode_visitas", label: "Visitas" },
];
const lastPermsSignature = ref<Record<number, string>>({});

const getPerms = (item: any) => {
    const perms: string[] = [];
    if (item.pode_editar) perms.push("pode_editar");
    if (item.pode_interacoes) perms.push("pode_interacoes");
    if (item.pode_visitas) perms.push("pode_visitas");
    return perms;
};

const updatePerms = async (item: any, values: string[]) => {
    if (item.principal) return;
    const data = {
        pode_editar: values.includes("pode_editar"),
        pode_interacoes: values.includes("pode_interacoes"),
        pode_visitas: values.includes("pode_visitas"),
    };
    const signature = JSON.stringify(data);
    if (lastPermsSignature.value[item.usuario.id] === signature) return;
    const ok = await oportunidade.updateResponsavelPerms(
        oportunidade.data!.id,
        item.usuario.id,
        data,
    );
    lastPermsSignature.value[item.usuario.id] = signature;
    if (ok) {
        ElMessage.success({
            message: "Permissões atualizadas!",
            grouping: true,
            plain: true,
        });
    }
};

const principalId = computed(() => {
    const list = oportunidade.responsaveis.data.data || [];
    const principal = list.find((item) => item.principal);
    return principal?.usuario.id ?? null;
});

const setPrincipal = async (userId: number) => {
    if (!oportunidade.data) return;
    if (principalId.value === userId) return;
    if (isSettingPrincipal.value) return;
    isSettingPrincipal.value = true;
    const ok = await oportunidade.updateResponsavelPerms(
        oportunidade.data.id,
        userId,
        {
            principal: true,
        },
    );
    if (ok) {
        ElMessage.success({
            message: "Responsável principal atualizado!",
            grouping: true,
            plain: true,
        });
    }
    isSettingPrincipal.value = false;
};

const unsetPrincipal = async (userId: number) => {
    if (!oportunidade.data) return;
    if (isSettingPrincipal.value) return;
    isSettingPrincipal.value = true;
    const ok = await oportunidade.updateResponsavelPerms(
        oportunidade.data.id,
        userId,
        {
            principal: false,
        },
    );

    if (ok) {
        ElMessage.success({
            message: "Responsável principal removido.",
            grouping: true,
            plain: true,
        });
    }

    isSettingPrincipal.value = false;
};

const originalUserState = reactive({
    perPage: usuarios.perPage,
    page: usuarios.page,
    filterByName: usuarios.filterByName,
    filterByStatus: usuarios.filterByStatus,
});

const transferData = computed<TransferOption[]>(() => {
    return (usuarios.data.data ?? []).map((item) => ({
        key: item.id,
        label: item.nome,
        disabled: item.desativado,
        avatar: item.avatar ?? null,
    }));
});

// Fecha o modal de visualização
const closeViewModal = () => {
    isOpen.value = false;
};

const loadData = async () => {
    if (!oportunidade.data) return;
    try {
        isInitialLoading.value = true;
        searchQuery.value = "";
        await oportunidade.findAllResponsaveis(oportunidade.data.id);
        selectedToAdd.value = [];
        selectedToRemove.value = [];
    } catch (err) {
        console.error(err);
    } finally {
        isInitialLoading.value = false;
    }
};

watch(
    () => isOpen.value,
    async (open) => {
        if (open) {
            originalUserState.perPage = usuarios.perPage;
            originalUserState.page = usuarios.page;
            originalUserState.filterByName = usuarios.filterByName;
            originalUserState.filterByStatus = usuarios.filterByStatus;
            await loadData();
        } else {
            debouncedSearch.cancel();
            searchQuery.value = "";
            isInitialLoading.value = false;
            usuarios.perPage = originalUserState.perPage;
            usuarios.page = originalUserState.page;
            usuarios.setFilterByName(originalUserState.filterByName);
            usuarios.setFilterByStatus(originalUserState.filterByStatus);
        }
    },
);

const debouncedSearch = debounce(async (query: string) => {
    usuarios.page = 1;
    usuarios.perPage = 25;
    usuarios.setFilterByName(query || null);
    usuarios.setFilterByStatus("ativo");
    await usuarios.findAll();
}, 350);

const onSearchInput = (query: string) => {
    searchQuery.value = query;
    debouncedSearch(query);
};

const onSelectVisibleChange = async (open: boolean) => {
    if (!open) return;
    if (usuarios.isLoading) return;
    if (usuarios.data.data?.length) return;
    isUsersInitialLoading.value = true;
    onSearchInput(searchQuery.value);
};

watch(
    () => usuarios.isLoading,
    (loading) => {
        if (!loading) isUsersInitialLoading.value = false;
    },
);

const totalResponsaveis = computed(
    () => oportunidade.responsaveis.data.total || 0,
);

const allResponsaveisIds = computed(
    () =>
        oportunidade.responsaveis.data.data?.map((item) => item.usuario.id) ||
        [],
);
const isAllSelected = computed(
    () =>
        allResponsaveisIds.value.length > 0 &&
        selectedToRemove.value.length === allResponsaveisIds.value.length,
);
const isIndeterminate = computed(
    () =>
        selectedToRemove.value.length > 0 &&
        selectedToRemove.value.length < allResponsaveisIds.value.length,
);
const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedToRemove.value = [];
        return;
    }
    selectedToRemove.value = allResponsaveisIds.value.filter((id) => {
        if (hasUserPermission(user.permissoes, UserPermissions.ADMIN))
            return true;
        return id !== user.id;
    });
};

const toggleRemove = (userId: number, checked: boolean) => {
    if (checked) {
        if (!selectedToRemove.value.includes(userId))
            selectedToRemove.value = [...selectedToRemove.value, userId];
        return;
    }
    selectedToRemove.value = selectedToRemove.value.filter(
        (id) => id !== userId,
    );
};

const addSelected = async () => {
    if (!oportunidade.data || isSyncing.value) return;
    const ids = selectedToAdd.value;
    if (!ids.length) return;
    isSyncing.value = true;
    const ok = await oportunidade.addResponsaveis(oportunidade.data.id, ids);
    if (ok) {
        ElMessage.success({
            message: "Responsáveis adicionados com sucesso!",
            grouping: true,
            plain: true,
        });
        selectedToAdd.value = [];
    }
    isSyncing.value = false;
};

const removeSelected = async () => {
    if (!oportunidade.data || isSyncing.value) return;
    const ids = selectedToRemove.value;
    if (!ids.length) return;
    isSyncing.value = true;
    const ok = await oportunidade.removeResponsaveis(oportunidade.data.id, ids);
    if (ok) {
        ElMessage.success({
            message: "Responsáveis removidos com sucesso!",
            grouping: true,
            plain: true,
        });
        selectedToRemove.value = [];
    }
    isSyncing.value = false;
};
</script>

<template>
    <ElDialog
        v-model="isOpen"
        title="Responsáveis da Oportunidade"
        class="!w-full md:!w-[500px]"
        @close="closeViewModal"
        destroy-on-close
        :z-index="1500"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Responsáveis da Oportunidade"
                @close="closeViewModal"
            />
        </template>
        <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
                <ElSelect
                    v-model="selectedToAdd"
                    class="!w-full"
                    multiple
                    filterable
                    remote
                    :remote-method="onSearchInput"
                    @visible-change="onSelectVisibleChange"
                    placeholder="Selecionar usuários"
                    :loading="usuarios.isLoading"
                    collapse-tags
                    collapse-tags-tooltip
                    clearable
                    :disabled="!canManageResponsaveis"
                >
                    <template #empty>
                        <div
                            v-if="usuarios.isLoading || isUsersInitialLoading"
                            class="flex items-center justify-center"
                        >
                            <ElIcon
                                class="is-loading"
                                color="var(--el-color-primary)"
                                size="18"
                            >
                                <Loading />
                            </ElIcon>
                        </div>
                        <span v-else>Sem resultados</span>
                    </template>
                    <ElOption
                        v-for="item in transferData"
                        :key="item.key"
                        :label="item.label"
                        :value="item.key"
                        :disabled="item.disabled"
                    >
                        <div class="flex items-center gap-2">
                            <ElAvatar
                                class="!text-black dark:!text-white !font-semibold !min-w-6 !max-w-6 !max-h-6 !min-h-6"
                                :src="parserAvatar(item.avatar)"
                            >
                                <span class="text-[12px] uppercase">
                                    {{ item.label?.slice(0, 1) }}
                                </span>
                            </ElAvatar>
                            <span class="truncate max-w-[200px]">
                                {{ item.label }}
                            </span>
                        </div>
                    </ElOption>
                </ElSelect>
                <ElButton
                    type="primary"
                    :disabled="
                        !canManageResponsaveis || !selectedToAdd.length || isSyncing
                    "
                    @click="addSelected"
                    :icon="Plus"
                >
                    Adicionar
                </ElButton>
            </div>

            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <ElCheckbox
                            class="!m-0"
                            :indeterminate="isIndeterminate"
                            :model-value="isAllSelected"
                            :disabled="!allResponsaveisIds.length"
                            @change="toggleSelectAll"
                        />
                        <span class="text-sm font-semibold">
                            Responsáveis
                            <span
                                class="text-xs text-black/60 dark:text-white/60"
                            >
                                ({{ totalResponsaveis }})
                            </span>
                        </span>
                    </div>
                    <ElDropdown trigger="click">
                        <ElButton
                            text
                            :icon="MoreFilled"
                            class="!text-gray-500 dark:!text-gray-400"
                        />
                        <template #dropdown>
                            <ElDropdownMenu>
                                <ElDropdownItem
                                    :disabled="
                                        !canManageResponsaveis ||
                                        !selectedToRemove.length ||
                                        isSyncing
                                    "
                                    @click="removeSelected"
                                    :icon="Delete"
                                >
                                    Remover
                                </ElDropdownItem>
                            </ElDropdownMenu>
                        </template>
                    </ElDropdown>
                </div>
                <div
                    class="relative rounded border border-black/10 dark:border-white/10 responsaveis-list"
                >
                    <ElScrollbar height="320px">
                        <div class="p-2 !pr-4 flex flex-col gap-2">
                            <div
                                v-if="
                                    isInitialLoading ||
                                    isSyncing ||
                                    oportunidade.responsaveis.isLoading
                                "
                                class="absolute inset-0 flex items-center justify-center"
                            >
                                <ElIcon
                                    class="is-loading"
                                    color="var(--el-color-primary)"
                                    size="25"
                                >
                                    <Loading />
                                </ElIcon>
                            </div>
                            <ElEmpty
                                v-else-if="
                                    !(oportunidade.responsaveis.data.data || [])
                                        .length
                                "
                                :image-size="60"
                                description="Sem responsáveis"
                                class="absolute inset-0 flex items-center justify-center"
                            />
                            <div v-else>
                                <div
                                    v-for="item in oportunidade.responsaveis
                                        .data.data || []"
                                    :key="item.usuario.id"
                                    class="relative flex items-center justify-between w-full gap-2 p-1 pr-0 rounded"
                                >
                                    <ElCheckbox
                                        :model-value="
                                            selectedToRemove.includes(
                                                item.usuario.id,
                                            )
                                        "
                                        @change="
                                            (checked) =>
                                                toggleRemove(
                                                    item.usuario.id,
                                                    checked as boolean,
                                                )
                                        "
                                        class="!w-full"
                                        :disabled="
                                            !canManageResponsaveis ||
                                            !hasUserPermission(
                                                user.permissoes,
                                                UserPermissions.ADMIN,
                                            ) && item.usuario.id === user.id
                                        "
                                    >
                                        <div
                                            class="flex items-center justify-between w-full"
                                        >
                                            <div
                                                class="relative flex items-center gap-2"
                                            >
                                                <ElAvatar
                                                    class="!text-black dark:!text-white !font-semibold !min-w-6 !max-w-6 !max-h-6 !min-h-6"
                                                    :src="
                                                        parserAvatar(
                                                            item.usuario.avatar,
                                                        )
                                                    "
                                                >
                                                    <span
                                                        class="text-[12px] uppercase"
                                                    >
                                                        {{
                                                            item.usuario.nome?.slice(
                                                                0,
                                                                1,
                                                            )
                                                        }}
                                                    </span>
                                                </ElAvatar>
                                                <span
                                                    class="truncate max-w-[220px]"
                                                >
                                                    {{ item.usuario.nome }}
                                                </span>
                                                <ElIcon
                                                    v-if="
                                                        principalId ===
                                                        item.usuario.id
                                                    "
                                                    class="!absolute !left-0 !ml-4 !rotate-180 !mb-2 !top-0 !text-nivel"
                                                    size="14"
                                                >
                                                    <StarFilled />
                                                </ElIcon>
                                            </div>
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <span
                                                    class="text-xs text-black/50 dark:text-white/50"
                                                >
                                                    {{
                                                        item.criado
                                                            ? $dayjs(
                                                                  item.criado,
                                                              ).format(
                                                                  "DD/MM/YYYY HH:mm",
                                                              )
                                                            : ""
                                                    }}
                                                </span>
                                                <ElTooltip
                                                    v-if="
                                                        item.usuario.id !==
                                                        user.id
                                                    "
                                                    content="Permissões"
                                                    placement="top"
                                                    effect="light"
                                                >
                                                    <ElDropdown
                                                        trigger="click"
                                                        :disabled="
                                                            !canManageResponsaveis
                                                        "
                                                    >
                                                        <ElButton
                                                            text
                                                            :icon="MoreFilled"
                                                            class="!text-gray-500 dark:!text-gray-400"
                                                        />
                                                        <template #dropdown>
                                                            <ElDropdownMenu>
                                                                <div
                                                                    class="flex flex-col px-2"
                                                                >
                                                                    <div
                                                                        class="text-[10px] uppercase text-black/50 dark:text-white/50"
                                                                    >
                                                                        Principal
                                                                    </div>
                                                                    <div
                                                                        class="flex flex-col gap-0"
                                                                    >
                                                                        <ElCheckbox
                                                                            :model-value="
                                                                                principalId ===
                                                                                item
                                                                                    .usuario
                                                                                    .id
                                                                            "
                                                                            @change="
                                                                                (
                                                                                    value,
                                                                                ) => {
                                                                                    if (
                                                                                        value
                                                                                    )
                                                                                        setPrincipal(
                                                                                            item
                                                                                                .usuario
                                                                                                .id,
                                                                                        );
                                                                                    else
                                                                                        unsetPrincipal(
                                                                                            item
                                                                                                .usuario
                                                                                                .id,
                                                                                        );
                                                                                }
                                                                            "
                                                                            size="small"
                                                                            class="!text-xs"
                                                                        >
                                                                            Responsável
                                                                            principal
                                                                        </ElCheckbox>
                                                                    </div>
                                                                </div>
                                                                <ElCheckboxGroup
                                                                    :model-value="
                                                                        getPerms(
                                                                            item,
                                                                        )
                                                                    "
                                                                    :disabled="
                                                                        item.principal
                                                                    "
                                                                    @change="
                                                                        (
                                                                            values,
                                                                        ) =>
                                                                            updatePerms(
                                                                                item,
                                                                                values as string[],
                                                                            )
                                                                    "
                                                                >
                                                                    <div
                                                                        class="flex flex-col gap-2 px-2 pt-2"
                                                                    >
                                                                        <div
                                                                            class="text-[10px] uppercase text-black/50 dark:text-white/50 mt-1"
                                                                        >
                                                                            Permissões
                                                                        </div>
                                                                        <div
                                                                            class="flex flex-col gap-0"
                                                                        >
                                                                            <ElCheckbox
                                                                                v-for="opt in permissaoOptions"
                                                                                :key="
                                                                                    opt.value
                                                                                "
                                                                                :label="
                                                                                    opt.value
                                                                                "
                                                                                size="small"
                                                                                class="!text-xs"
                                                                                :disabled="
                                                                                    item.principal
                                                                                "
                                                                            >
                                                                                {{
                                                                                    opt.label
                                                                                }}
                                                                            </ElCheckbox>
                                                                        </div>
                                                                    </div>
                                                                </ElCheckboxGroup>
                                                            </ElDropdownMenu>
                                                        </template>
                                                    </ElDropdown>
                                                </ElTooltip>
                                            </div>
                                        </div>
                                    </ElCheckbox>
                                </div>
                            </div>
                        </div>
                    </ElScrollbar>
                </div>
            </div>
        </div>
    </ElDialog>
</template>

<style scoped>
:deep(.responsaveis-list .el-checkbox__label) {
    width: 100%;
    display: block;
}
</style>
