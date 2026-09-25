<script setup lang="ts">
import { InfoFilled, Clock, Suitcase } from "@element-plus/icons-vue";

const { user: userAuth } = useAuthSession();
const usuario = useUsuario();
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
                            #{{ usuario?.data?.id }}
                        </span>
                    </div>
                </div>
                <!-- Mostra o status -->
                <div class="space-y-2 w-full">
                    <h3 class="text-sm">Status</h3>
                    <div class="flex items-center gap-1">
                        <ElTag
                            effect="dark"
                            :class="{
                                '!bg-red-400 !border-red-400':
                                    usuario.data?.empresa?.desativado ||
                                    usuario.data?.desativado,
                                '!bg-nivel !border-nivel !text-black':
                                    !usuario.data?.empresa?.desativado ||
                                    !usuario.data?.desativado,
                            }"
                            :type="
                                usuario.data?.empresa?.desativado ||
                                !usuario.data?.desativado
                                    ? 'primary'
                                    : 'danger'
                            "
                            disable-transitions
                        >
                            <span class="font-medium">
                                {{
                                    !usuario.data?.empresa?.desativado &&
                                    !usuario.data?.desativado
                                        ? "Ativo"
                                        : "Inativo"
                                }}
                            </span>
                        </ElTag>
                    </div>
                </div>
            </div>
            <!-- Mostra a empresa vinculada -->
            <div
                v-if="
                    hasUserPermission(
                        userAuth.permissoes,
                        UserPermissions.GRANT_ADMIN,
                    ) && usuario.data?.empresa?.nome
                "
                class="space-y-2 w-full"
            >
                <h3 class="text-sm">Vinculado há</h3>
                <div class="flex items-center gap-1">
                    <ElIcon size="large">
                        <Suitcase />
                    </ElIcon>
                    <span
                        class="text-xs truncate text-black/80 dark:text-white/80"
                    >
                        {{ usuario.data?.empresa?.nome }}
                    </span>
                </div>
            </div>
            <div
                class="flex md:flex-col flex-row md:items-start gap-2 items-center md:space-y-8"
            >
                <!-- Mostra a data que foi criado -->
                <div class="space-y-2 w-full">
                    <h3 class="text-sm">Criado em</h3>
                    <div class="flex items-center gap-1">
                        <ElIcon size="large">
                            <Clock />
                        </ElIcon>
                        <span
                            class="text-xs truncate text-black/80 dark:text-white/80"
                        >
                            {{
                                $dayjs(usuario.data?.criado).format(
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
                                $dayjs(usuario.data?.atualizado).format(
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
