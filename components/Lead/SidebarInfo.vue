<script setup lang="ts">
import { InfoFilled, Clock } from "@element-plus/icons-vue";

const lead = useLead();
const gruposPreview = computed(
    () =>
        (lead.data as { grupos?: Array<{ id: number; nome: string }> } | null)
            ?.grupos ?? [],
);
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
                class="flex md:flex-col flex-row md:items-start gap-2 items-center md:space-y-8"
            >
                <!-- Mostra o Id -->
                <div class="space-y-2 w-full">
                    <h3 class="text-sm">ID</h3>
                    <div class="flex flex-wrap items-center gap-1">
                        <span class="text-sm text-black/80 dark:text-white/80">
                            #{{ lead?.data?.id }}
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
                <!-- Mostra quem criou a unidade -->
                <div class="space-y-2 w-full truncate">
                    <h3 class="text-sm">Cadastrado Por</h3>
                    <div class="flex items-center gap-1.5">
                        <ElAvatar
                            class="!text-black dark:!text-white !font-semibold !min-w-6 !max-w-6 !max-h-6 !min-h-6"
                            :src="parserAvatar(lead.data?.usuario?.avatar)"
                        >
                            <span class="text-[11px] uppercase">
                                {{ lead.data?.usuario?.nome.slice(0, 1) }}
                            </span>
                        </ElAvatar>
                        <span
                            class="text-xs truncate text-black/80 dark:text-white/80"
                        >
                            {{ lead.data?.usuario!.nome }}
                        </span>
                    </div>
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
                                $dayjs(lead.data?.criado).format(
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
                                $dayjs(lead.data?.atualizado).format(
                                    "DD[/]MM[/]YYYY, [às] HH:mm",
                                )
                            }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </ElScrollbar>
</template>
