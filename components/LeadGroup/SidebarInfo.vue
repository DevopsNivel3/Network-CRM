<script setup lang="ts">
import { InfoFilled, Clock } from "@element-plus/icons-vue";

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
    group: LeadGroupData | null;
}>();
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
                <div class="space-y-2 w-full">
                    <h3 class="text-sm">ID</h3>
                    <div class="flex items-center gap-1">
                        <span class="text-sm text-black/80 dark:text-white/80">
                            #{{ props.group?.id || "-" }}
                        </span>
                    </div>
                </div>
                <div class="space-y-2 w-full truncate">
                    <h3 class="text-sm">Cadastrado Por</h3>
                    <div class="flex items-center gap-1.5">
                        <ElAvatar
                            class="!text-black dark:!text-white !font-semibold !min-w-6 !max-w-6 !max-h-6 !min-h-6"
                        >
                            <span class="text-[12px] uppercase">
                                {{ props.group?.usuario?.nome?.slice(0, 1) }}
                            </span>
                        </ElAvatar>
                        <span
                            class="text-xs truncate text-black/80 dark:text-white/80"
                        >
                            {{ props.group?.usuario?.nome || "-" }}
                        </span>
                    </div>
                </div>
            </div>
            <div
                class="flex md:flex-col flex-row md:items-start gap-2 items-center md:space-y-8"
            >
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
                                props.group?.criado
                                    ? $dayjs(props.group.criado).format(
                                          "DD[/]MM[/]YYYY, [às] HH:mm",
                                      )
                                    : "-"
                            }}
                        </span>
                    </div>
                </div>
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
                                props.group?.atualizado
                                    ? $dayjs(props.group.atualizado).format(
                                          "DD[/]MM[/]YYYY, [às] HH:mm",
                                      )
                                    : "-"
                            }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </ElScrollbar>
</template>
