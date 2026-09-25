<script setup lang="ts">
const usuario = useUsuario();
</script>

<template>
    <ElScrollbar class="!h-full relative !w-full">
        <div class="p-4 flex flex-col gap-4">
            <template v-if="usuario.data?.permissoes !== 0">
                <div
                    v-for="(module, moduleIndex) in getUserPermissionsByModule(
                        Number(usuario.data?.permissoes),
                    )"
                    :key="moduleIndex"
                    class="rounded border border-black/10 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5"
                >
                    <div class="text-xs font-semibold uppercase opacity-70">
                        Módulo
                    </div>
                    <div class="text-base font-semibold mt-1">
                        {{ module.label }}
                    </div>
                    <div
                        v-if="
                            module.groups?.some(
                                (group) => group.label === 'Administração',
                            )
                        "
                        class="mt-4 flex flex-wrap gap-2 text-xs text-black/80 dark:text-white/80"
                    >
                        <span
                            v-for="(action, actionIndex) in module.groups.find(
                                (group) => group.label === 'Administração',
                            )?.actions"
                            :key="actionIndex"
                            class="px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-wrap"
                        >
                            {{ action }}
                        </span>
                    </div>

                    <div class="mt-4 space-y-3">
                        <div
                            v-for="(group, groupIndex) in module.groups"
                            :key="groupIndex"
                            class="flex flex-col gap-2"
                        >
                            <template v-if="group.label !== 'Administração'">
                                <div
                                    class="text-xs font-semibold uppercase opacity-70"
                                >
                                    Grupo
                                </div>
                                <div class="text-sm font-medium">
                                    {{ group.label }}
                                </div>
                                <div
                                    class="flex flex-wrap gap-2 text-xs text-black/80 dark:text-white/80"
                                >
                                    <span
                                        v-for="(
                                            action, actionIndex
                                        ) in group.actions"
                                        :key="actionIndex"
                                        class="px-2 py-1 rounded bg-black/10 dark:bg-white/10 text-wrap"
                                    >
                                        {{ action }}
                                    </span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else>
                <div
                    class="absolute inset-0 h-full w-full flex items-center justify-center bg-black/5 dark:bg-white/5 rounded text-sm"
                >
                    No momento não há permissões.
                </div>
            </template>
        </div>
    </ElScrollbar>
</template>
