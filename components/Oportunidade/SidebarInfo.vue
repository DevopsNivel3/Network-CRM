<script setup lang="ts">
import { InfoFilled, Clock, Edit, StarFilled } from "@element-plus/icons-vue";

const oportunidade = useOportunidade();
const { user } = useAuthSession();
const device = useDevice();
const openEditResponsaveisModal = ref<boolean>(false);
const handleOpenEditResponsaveis = () =>
    (openEditResponsaveisModal.value = true);
const canManageResponsaveis = computed(
    () =>
        hasUserPermission(
            user.permissoes,
            UserPermissions.GERENCIAR_RESPONSAVEIS,
        ) || !!oportunidade.data?.responsavel_atual?.gerencia_responsaveis,
);

const gruposPreview = computed(() => oportunidade.data?.lead?.grupos ?? []);
const responsaveisData = computed(() => {
    const data: { nome: string; avatar: string; principal?: boolean }[] = [];

    if (oportunidade.data?.responsaveis)
        oportunidade.data.responsaveis.forEach((responsavel) => {
            data.push({
                nome: responsavel.usuario.nome,
                avatar: responsavel.usuario.avatar,
                principal: responsavel.principal,
            });
        });

    return data;
});
</script>

<template>
    <ElScrollbar class="!h-full !w-full">
        <div class="space-y-4 md:space-y-8 py-4 md:pr-4">
            <h1
                class="flex items-center gap-2 font-semibold tracking-wider uppercase"
            >
                <ElIcon size="large">
                    <InfoFilled />
                </ElIcon>
                Informações
            </h1>
            <div
                class="flex md:flex-col flex-row md:items-start gap-2 items-center md:space-y-6"
            >
                <!-- Mostra o Id -->
                <div class="space-y-2 w-full">
                    <h3 class="text-sm">ID</h3>
                    <div class="flex items-center gap-1">
                        <span class="text-sm text-black/80 dark:text-white/80">
                            #{{ oportunidade?.data?.id }}
                        </span>
                    </div>
                </div>
                <div class="space-y-2 w-full truncate">
                    <h3 class="text-sm">Grupos</h3>
                    <div class="flex flex-wrap items-center gap-1">
                        <template v-if="gruposPreview.length">
                            <ElTag
                                v-for="grupo in gruposPreview"
                                :key="grupo.id"
                                size="small"
                                type="info"
                                effect="plain"
                                class="!font-medium"
                                disable-transitions
                            >
                                {{ grupo.nome }}
                            </ElTag>
                        </template>
                        <span
                            v-else
                            class="text-xs text-black/60 dark:text-white/60"
                        >
                            Nenhum grupo
                        </span>
                    </div>
                </div>
                <!-- Mostra os responsáveis -->
                <div class="space-y-2 w-full truncate">
                    <div class="flex items-center gap-1">
                        <h3 class="text-sm">Responsáveis</h3>
                        <ElTooltip
                            v-if="canManageResponsaveis"
                            effect="light"
                            content="Gerenciar Responsáveis"
                            placement="top"
                            :disabled="device.isMobile"
                        >
                            <div
                                class="flex items-center justify-center cursor-pointer rounded-full transition-colors"
                                @click="handleOpenEditResponsaveis"
                            >
                                <ElIcon
                                    class="!text-nivel !flex !items-center !justify-center"
                                    size="small"
                                >
                                    <Edit />
                                </ElIcon>
                            </div>
                        </ElTooltip>
                    </div>
                    <div class="flex items-center gap-1">
                        <template v-if="responsaveisData.length">
                            <ElTooltip
                                v-for="responsavel in responsaveisData"
                                :key="responsavel.nome"
                                effect="light"
                                :content="responsavel.nome"
                                placement="top"
                                :disabled="device.isMobile"
                            >
                                <div class="relative">
                                    <ElAvatar
                                        class="!text-black dark:!text-white !font-semibold !min-w-6 !max-w-6 !max-h-6 !min-h-6"
                                        :src="parserAvatar(responsavel.avatar)"
                                    >
                                        <span class="text-[12px] uppercase">
                                            {{ responsavel?.nome?.slice(0, 1) }}
                                        </span>
                                    </ElAvatar>
                                    <ElIcon
                                        v-if="responsavel.principal"
                                        class="!absolute !left-0 !ml-4 !rotate-180 !mb-2 !top-0 !text-nivel"
                                        size="14"
                                    >
                                        <StarFilled />
                                    </ElIcon>
                                </div>
                            </ElTooltip>
                            <div
                                v-if="
                                    oportunidade.data &&
                                    (oportunidade.data?._count?.responsaveis ||
                                        0) > responsaveisData.length
                                "
                                class="!text-black dark:!text-white !bg-black/5 dark:!bg-white/5 rounded-xl flex items-center justify-center !font-semibold !max-h-[26px] !min-h-[26px] !px-2"
                            >
                                <span class="text-[12px] uppercase">
                                    {{
                                        "+" +
                                        ((oportunidade.data?._count
                                            ?.responsaveis || 0) -
                                            responsaveisData.length)
                                    }}
                                </span>
                            </div>
                        </template>
                        <span
                            v-else
                            class="text-xs text-black/60 dark:text-white/60"
                        >
                            Nenhum responsável
                        </span>
                    </div>
                </div>
            </div>
            <!-- Mostra quem criou -->
            <div
                v-if="hasUserPermission(user.permissoes, UserPermissions.ADMIN)"
                class="space-y-2 w-full truncate"
            >
                <h3 class="text-sm">Cadastrado Por</h3>
                <div class="flex items-center gap-1.5">
                    <ElAvatar
                        class="!text-black dark:!text-white !font-semibold !min-w-6 !max-w-6 !max-h-6 !min-h-6"
                        :src="parserAvatar(oportunidade.data?.usuario?.avatar)"
                    >
                        <span class="text-[12px] uppercase">
                            {{ oportunidade.data?.usuario?.nome.slice(0, 1) }}
                        </span>
                    </ElAvatar>
                    <span
                        class="text-xs truncate text-black/80 dark:text-white/80"
                    >
                        {{ oportunidade.data?.usuario?.nome }}
                    </span>
                </div>
            </div>
            <div
                class="flex md:flex-col flex-row md:items-start gap-2 items-center md:space-y-8"
            >
                <!-- Mostra a data que foi criado -->
                <div class="space-y-2 w-full">
                    <h3 class="text-sm">Cadastrado Em</h3>
                    <div class="flex items-center gap-1">
                        <ElIcon size="large">
                            <Clock />
                        </ElIcon>
                        <span
                            class="text-xs truncate text-black/80 dark:text-white/80"
                        >
                            {{
                                $dayjs(oportunidade.data?.criado).format(
                                    "DD[/]MM[/]YYYY, [às] HH:mm",
                                )
                            }}
                        </span>
                    </div>
                </div>
                <!-- Mostra a data foi atualizado pela última vez -->
                <div class="space-y-2 w-full">
                    <h3 class="text-sm">Última Atualização</h3>
                    <div class="flex items-center gap-1">
                        <ElIcon size="large">
                            <Clock />
                        </ElIcon>
                        <span
                            class="text-xs truncate text-black/80 dark:text-white/80"
                        >
                            {{
                                $dayjs(oportunidade.data?.atualizado).format(
                                    "DD[/]MM[/]YYYY, [às] HH:mm",
                                )
                            }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </ElScrollbar>
    <OportunidadeResponsaveisEditModal
        v-if="canManageResponsaveis"
        v-model:isOpen="openEditResponsaveisModal"
    />
</template>
