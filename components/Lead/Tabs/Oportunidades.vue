<script setup lang="ts">
import { Folder, User, Plus, StarFilled } from "@element-plus/icons-vue";

const lead = useLead();
const { user } = useAuthSession();
const emit = defineEmits<{
    (e: "open-view", id: number): void;
    (e: "open-create"): void;
}>();

const oportunidades = computed(() => lead.oportunidades.data.data ?? []);
const canCreateOportunidade = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.CRIAR_OPORTUNIDADE),
);

const openView = (id: number) => emit("open-view", id);
const openCreate = () => emit("open-create");
const isAdmin = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.ADMIN),
);
const getResponsaveis = (item: any) => item.responsaveis || [];
const getExtraCount = (item: any, shown: number) =>
    Math.max((item._count?.responsaveis || 0) - shown, 0);

const loadMore = async () => {
    if (!lead.data?.id) return;
    await lead.loadMoreOportunidades(lead.data.id);
};
</script>

<template>
    <ElScrollbar class="!relative !h-full !w-full">
        <div class="p-4 flex flex-col gap-4">
            <div
                v-if="!lead.oportunidades.isLoading && oportunidades.length > 0"
                class="absolute right-0 left-0 px-4 top-0 z-10 flex items-center justify-between bg-[var(--el-bg-color)] py-3"
            >
                <h1
                    class="flex items-center gap-2 font-semibold tracking-wider uppercase"
                >
                    Oportunidades
                </h1>
                <ElButton
                    v-if="canCreateOportunidade"
                    @click="openCreate"
                    type="primary"
                    :icon="Plus"
                    size="small"
                >
                    Adicionar
                </ElButton>
            </div>

            <div
                v-if="!lead.oportunidades.isLoading && oportunidades.length > 0"
                v-infinite-scroll="loadMore"
                :infinite-scroll-disabled="
                    lead.oportunidades.isLoading || !lead.hasMoreOportunidades
                "
                class="flex flex-col gap-3 mt-8"
            >
                <div
                    v-for="oportunidade in oportunidades"
                    :key="oportunidade.id"
                    class="rounded border border-black/10 w-full dark:border-white/10 bg-black/5 dark:bg-white/5 flex"
                >
                    <div
                        :class="{
                            'bg-green-500/40': !oportunidade.desativado,
                            'bg-red-500/40': oportunidade.desativado,
                        }"
                        class="w-[24px] py-2 font-medium text-black/80 dark:text-white rounded-l border-r border-black/10 dark:border-white/10 text-xs uppercase flex items-center justify-center [writing-mode:vertical-rl] [text-orientation:upright]"
                    >
                        {{ oportunidade.desativado ? "Inativo" : "Ativo" }}
                    </div>
                    <div class="flex flex-col min-h-0 w-full p-4 gap-3">
                        <div class="flex items-center justify-between gap-3">
                            <span class="text-sm uppercase font-medium">
                                Oportunidade #{{ oportunidade.id }}
                            </span>
                            <ElTooltip
                                content="Visualizar"
                                placement="bottom"
                                effect="light"
                                :hide-after="0"
                            >
                                <ElButton
                                    size="small"
                                    :icon="Folder"
                                    @click="openView(oportunidade.id)"
                                />
                            </ElTooltip>
                        </div>
                        <div class="flex-1 min-h-0">
                            <div class="flex justify-between gap-3">
                                <div
                                    class="text-xs text-black/70 dark:text-white/70"
                                >
                                    <span class="font-medium">Tipo:</span>
                                    {{ oportunidade.tipo || "Não informado" }}
                                </div>
                                <div
                                    v-if="isAdmin"
                                    class="text-xs text-black/70 dark:text-white/70"
                                >
                                    <span class="font-medium"
                                        >Cadastrado por:</span
                                    >
                                    {{
                                        oportunidade.usuario?.nome ||
                                        "Não informado"
                                    }}
                                </div>
                            </div>
                            <div
                                v-if="oportunidade.descricao"
                                class="text-sm text-black/70 dark:text-white/70 mt-2"
                            >
                                <span class="text-xs font-medium"
                                    >Descrição:</span
                                >
                                <div
                                    class="p-2 rounded-md break-words bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-gray-700"
                                >
                                    {{ oportunidade.descricao }}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between gap-3">
                            <div class="text-sm flex items-center gap-2">
                                <div class="flex items-center gap-1">
                                    <template
                                        v-if="
                                            getResponsaveis(oportunidade).length
                                        "
                                    >
                                        <ElTooltip
                                            v-for="resp in getResponsaveis(
                                                oportunidade,
                                            )"
                                            :key="resp.usuario?.id"
                                            :content="
                                                resp.usuario?.nome ||
                                                'Desconhecido'
                                            "
                                            placement="top"
                                            effect="light"
                                        >
                                            <div class="relative">
                                                <ElAvatar
                                                    class="!text-black dark:!text-white !max-w-6 !max-h-6 !min-h-6 !min-w-6 !font-semibold"
                                                    :src="
                                                        parserAvatar(
                                                            resp.usuario
                                                                ?.avatar,
                                                        )
                                                    "
                                                    size="small"
                                                >
                                                    <span
                                                        v-if="
                                                            resp.usuario?.nome
                                                        "
                                                        class="uppercase text-[10px]"
                                                    >
                                                        {{
                                                            resp.usuario.nome.slice(
                                                                0,
                                                                1,
                                                            )
                                                        }}
                                                    </span>
                                                </ElAvatar>
                                                <ElIcon
                                                    v-if="resp.principal"
                                                    class="!absolute !left-0 !ml-4 !rotate-180 !mb-2 !top-0 !text-nivel"
                                                    size="14"
                                                >
                                                    <StarFilled />
                                                </ElIcon>
                                            </div>
                                        </ElTooltip>
                                        <div
                                            v-if="
                                                getExtraCount(
                                                    oportunidade,
                                                    getResponsaveis(
                                                        oportunidade,
                                                    ).length,
                                                ) > 0
                                            "
                                            class="!text-black dark:!text-white !bg-black/5 dark:!bg-white/5 rounded-xl flex items-center justify-center !font-semibold !max-h-[24px] !min-h-[24px] !px-2"
                                        >
                                            <span class="text-[11px] uppercase">
                                                +{{
                                                    getExtraCount(
                                                        oportunidade,
                                                        getResponsaveis(
                                                            oportunidade,
                                                        ).length,
                                                    )
                                                }}
                                            </span>
                                        </div>
                                    </template>
                                    <ElAvatar
                                        v-else
                                        class="!text-black dark:!text-white !max-w-6 !max-h-6 !min-h-6 !min-w-6 !font-semibold"
                                        size="small"
                                    />
                                </div>
                            </div>
                            <span
                                class="text-xs text-black/70 dark:text-white/70"
                            >
                                <span class="font-medium">Criado em:</span>
                                {{
                                    $dayjs(oportunidade.criado).format(
                                        "DD/MM/YYYY, [às] HH:mm",
                                    )
                                }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-else-if="!lead.oportunidades.isLoading"
                class="h-96 md:h-full md:absolute inset-0 bg-black/5 dark:bg-white/5 flex flex-col gap-2 items-center justify-center"
            >
                No momento não há oportunidades.
                <ElButton
                    v-if="canCreateOportunidade"
                    @click="openCreate"
                    type="primary"
                    :icon="Plus"
                    size="small"
                >
                    Adicionar
                </ElButton>
            </div>

            <UILoadingOverlay v-if="lead.oportunidades.isLoading" />
        </div>
    </ElScrollbar>
</template>
