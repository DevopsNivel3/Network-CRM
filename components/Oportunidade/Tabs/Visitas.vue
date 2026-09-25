<script setup lang="ts">
import { LocationFilled, Plus } from "@element-plus/icons-vue";

const oportunidade = useOportunidade();
const visitas = useVisitas();
const visita = useVisita();
const emit = defineEmits<{
    (e: "open-create-visita"): void;
    (e: "open-view-visita"): void;
}>();

const openCreateVisitaModal = () => emit("open-create-visita");

const openViewVisitaModal = (id: number) => {
    visita.findById(id);
    emit("open-view-visita");
};

const visitasData = computed(() => oportunidade.visitas.data || []);
const canCreateVisitas = computed(
    () =>
        !!oportunidade.data?.responsavel_atual?.pode_visitas ||
        !!oportunidade.data?.responsavel_atual?.principal,
);
</script>

<template>
    <ElScrollbar class="!relative !h-full !w-full">
        <div class="p-4">
            <div class="w-full flex flex-col gap-2">
                <div
                    v-if="
                        !oportunidade.visitas.isLoading &&
                        visitasData.length > 0
                    "
                    class="absolute right-0 left-0 px-4 top-0 z-10 flex items-center justify-between bg-[var(--el-bg-color)] py-3"
                >
                    <h1
                        class="flex items-center gap-2 font-semibold tracking-wider uppercase"
                    >
                        Quadro de Visitas
                    </h1>
                    <ElButton
                        v-if="canCreateVisitas"
                        @click="openCreateVisitaModal"
                        type="primary"
                        :icon="Plus"
                        size="small"
                    >
                        Agendar
                    </ElButton>
                </div>
                <div
                    class="h-96 md:h-full flex flex-col items-center gap-2 w-full"
                >
                    <template
                        v-if="
                            !oportunidade.visitas.isLoading &&
                            visitasData.length > 0
                        "
                    >
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 w-full mt-8"
                        >
                            <div
                                v-for="(item, index) in visitasData"
                                :key="index"
                                class="flex flex-col gap-6 bg-black/5 shadow-md dark:bg-white/5 border-2 dark:border-white/5 border-black-5 rounded-md w-full h-full px-4 py-3"
                            >
                                <div
                                    class="flex items-center justify-between w-full gap-6"
                                >
                                    <span>
                                        {{
                                            visitas.getVisitaStatus[
                                                item.statusInt
                                            ]
                                        }}
                                    </span>
                                    <ElButton
                                        @click="openViewVisitaModal(item.id)"
                                        size="small"
                                    >
                                        Ver detalhes
                                    </ElButton>
                                </div>
                                <p class="text-xs">
                                    Agendado para:
                                    {{
                                        $dayjs(item.data_inicio).format(
                                            "DD/MM/YYYY",
                                        ) +
                                        " as " +
                                        item.hora_inicio.slice(0, 5)
                                    }}
                                </p>
                            </div>
                        </div>
                    </template>

                    <div
                        v-else-if="
                            !oportunidade.visitas.isLoading &&
                            visitasData.length === 0
                        "
                        class="h-96 md:h-full md:absolute inset-0 bg-black/5 dark:bg-white/5 flex flex-col gap-2 items-center justify-center"
                    >
                        No momento não há visitas.
                        <ElButton
                            v-if="canCreateVisitas"
                            @click="openCreateVisitaModal"
                            type="primary"
                            :icon="Plus"
                            size="small"
                        >
                            Agendar
                        </ElButton>
                    </div>
                </div>
            </div>
            <UILoadingOverlay v-if="oportunidade.visitas.isLoading" />
        </div>
    </ElScrollbar>
</template>
