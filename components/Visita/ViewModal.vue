<script setup lang="ts">
import { Picture, Loading } from "@element-plus/icons-vue";

const oportunidade = useOportunidade();
const visitas = useVisitas();
const visita = useVisita();
const props = defineProps<{
    modelValue: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});
const isEndOpen = ref(false);
const isCancelOpen = ref(false);
const isReagendarOpen = ref(false);

// Fecha o modal de visualização
const closeViewModal = () => (isOpen.value = false);

// Abre o modal de finalizar
const openEndVisitaModal = () => (isEndOpen.value = true);

// Abre o modal de cancelar
const openCancelVisitaModal = () => (isCancelOpen.value = true);

// Abre o modal de reagendar
const openReagendarVisitaModal = () => (isReagendarOpen.value = true);

// Atualiza o status da visita
const handleVisitaStatus = async (newStatus: number) => {
    try {
        const visitaId = visita.data!.id;
        const isVisitaStatusUpdated = await visita.updateStatusById(
            visitaId,
            newStatus,
        );

        if (isVisitaStatusUpdated) {
            ElMessage.success({
                message: `Status da visita atualizado!`,
                customClass: "!z-[2500]",
                plain: true,
            });

            visitas.updateStatusFromState(visitaId, newStatus);
            if (oportunidade.hasVisitas)
                oportunidade.updateVisitaFromState(visitaId, {
                    statusInt: newStatus,
                });
        }
    } catch (err) {
        console.error(err);
    }
};
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[600px]"
        v-model="isOpen"
        title="Visualizando Visita"
        @close="closeViewModal"
        destroy-on-close
        :z-index="1500"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Visualizando Visita"
                @close="closeViewModal"
            />
        </template>
        <div v-if="!visita.isLoading">
            <ElTimeline class="!mt-4 !w-full">
                <ElTimelineItem
                    :timestamp="
                        $dayjs(visita.data?.criado).format(
                            'DD/MM/YYYY [às] HH:mm',
                        )
                    "
                    center
                >
                    Agendamento realizado
                </ElTimelineItem>
                <ElTimelineItem center>
                    <div>
                        <h4 class="truncate">
                            Endereço de
                            {{ visita.data?.oportunidade?.lead?.nome_lead }}
                        </h4>
                        <div
                            class="flex mt-2 items-center gap-2 b px-4 py-2 bg-black/5 dark:bg-white/5 rounded-t"
                        >
                            {{
                                [
                                    visita.data?.localizacao.rua,
                                    visita.data?.localizacao.numero
                                        ? `Nº ${visita.data?.localizacao.numero}`
                                        : null,
                                    visita.data?.localizacao.cidade,
                                    visita.data?.localizacao.estado,
                                    visita.data?.localizacao.cep
                                        ? formatCep(
                                              visita.data?.localizacao.cep,
                                          )
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(", ")
                            }}
                        </div>
                        <UIMapbox
                            :endereco="`${visita.data?.localizacao.rua}, ${visita.data?.localizacao.numero}, ${visita.data?.localizacao.cidade}, ${visita.data?.localizacao.estado}, ${visita.data?.localizacao.cep}`"
                        />
                    </div>
                </ElTimelineItem>
                <ElTimelineItem
                    v-if="visita.data?.statusInt !== 3"
                    :timestamp="
                        'Agendado para ' +
                        $dayjs(visita.data?.data_inicio).format(
                            'dddd, DD/MM/YYYY',
                        ) +
                        ' às ' +
                        visita.data?.hora_inicio.slice(0, 5)
                    "
                    center
                >
                    Status: Pendente - Aguardando início
                </ElTimelineItem>
                <ElTimelineItem
                    v-if="visita.data?.statusInt === 3"
                    :timestamp="
                        'Reagendado para ' +
                        $dayjs(visita.data?.data_inicio).format(
                            'dddd, DD/MM/YYYY',
                        ) +
                        ' às ' +
                        visita.data?.hora_inicio.slice(0, 5)
                    "
                    center
                >
                    <h4 class="truncate">Reagendamento realizado</h4>
                    <div class="shadow">
                        <div
                            class="p-2 rounded-t text-xs text-center bg-black/5 dark:bg-white/5 w-full"
                        >
                            Motivo
                        </div>
                        <p
                            class="bg-black/10 dark:bg-white/20 px-4 py-2 rounded-b"
                        >
                            {{ visita.data?.motivo }}
                        </p>
                    </div>
                </ElTimelineItem>
                <ElTimelineItem
                    v-if="
                        visita.data?.statusInt !== 4 &&
                        visita.data?.statusInt !== 5 &&
                        visita.data?.statusInt !== 1 &&
                        visita.data?.statusInt !== 3
                    "
                    :timestamp="
                        'Atualizado em ' +
                        $dayjs(visita.data?.atualizado).format(
                            'DD/MM/YYYY [às] HH:mm',
                        )
                    "
                    center
                >
                    Status:
                    {{ visitas.getVisitaStatus[visita.data!.statusInt] }}
                </ElTimelineItem>
                <ElTimelineItem
                    v-if="visita.data?.statusInt === 4"
                    :timestamp="
                        'Cancelada em ' +
                        $dayjs(visita.data?.data_fim).format(
                            'DD/MM/YYYY [às] HH:mm',
                        )
                    "
                    center
                >
                    <h4 class="truncate">Visita cancelada</h4>
                    <div class="shadow">
                        <div
                            class="p-2 rounded-t text-xs text-center bg-black/5 dark:bg-white/5 w-full"
                        >
                            Motivo
                        </div>
                        <p
                            class="bg-black/10 dark:bg-white/20 px-4 py-2 rounded-b"
                        >
                            {{ visita.data?.motivo }}
                        </p>
                    </div>
                </ElTimelineItem>
                <ElTimelineItem
                    v-if="visita.data?.statusInt === 5"
                    :timestamp="
                        'Concluída em ' +
                        $dayjs(visita.data?.data_fim).format(
                            'DD/MM/YYYY [às] HH:mm',
                        )
                    "
                    center
                >
                    <div>
                        <h4 class="truncate">Visita Concluída</h4>

                        <span
                            class="flex items-center justify-end text-xs text-black/80 dark:text-white/80 mb-1"
                        >
                            Clique para visualizar
                        </span>
                        <ElImage
                            class="!w-full !h-24 !rounded-md !shadow-md !overflow-hidden"
                            :preview-src-list="[
                                visita.data?.imagem_src
                                    ? '/uploads' + visita.data?.imagem_src
                                    : '',
                            ]"
                            :src="
                                visita.data?.imagem_src
                                    ? '/uploads' + visita.data?.imagem_src
                                    : ''
                            "
                            :min-scale="0.2"
                            :zoom-rate="1.2"
                            :max-scale="7"
                            fit="cover"
                        >
                            <template #error>
                                <div
                                    class="flex items-center justify-center w-full h-full rounded-md bg-black/10 dark:bg-white/20 shadow-md"
                                >
                                    <div
                                        class="flex gap-2 flex-col items-center justify-center"
                                    >
                                        <ElIcon size="25">
                                            <Picture />
                                        </ElIcon>
                                        <p class="text-sm">
                                            Não foi possível carregar a imagem
                                        </p>
                                    </div>
                                </div>
                            </template>
                            <template #placeholder>
                                <div
                                    class="flex items-center justify-center w-full h-full rounded-md bg-black/10 dark:bg-white/20 shadow-md"
                                >
                                    <div
                                        class="flex gap-2 flex-col items-center justify-center"
                                    >
                                        <ElIcon size="25">
                                            <Picture />
                                        </ElIcon>
                                        <p class="text-sm">
                                            Não foi possível carregar a imagem
                                        </p>
                                    </div>
                                </div>
                            </template>
                        </ElImage>
                        <div
                            class="flex mt-2 items-center justify-between px-4 py-2 bg-black/5 dark:bg-white/5 rounded-t"
                        >
                            <span>
                                Latitude:
                                {{ visita.data?.latitude || "0.000" }}</span
                            >
                            <div
                                class="w-[0.5px] h-4 bg-black/40 dark:bg-white/20"
                            />
                            <span>
                                Longitude:
                                {{ visita.data?.longitude || "0.000" }}
                            </span>
                        </div>
                        <UIMapbox
                            :coords="[
                                Number(visita.data?.latitude),
                                Number(visita.data?.longitude),
                            ]"
                        />
                    </div>
                </ElTimelineItem>
            </ElTimeline>
        </div>
        <div
            v-if="visita.isLoading"
            class="flex items-center justify-center h-96 w-full"
        >
            <ElIcon
                class="is-loading"
                color="var(--el-color-primary)"
                size="25"
            >
                <Loading />
            </ElIcon>
        </div>
        <template #footer>
            <div class="flex flex-wrap justify-end">
                <ElButton @click="closeViewModal"> Fechar </ElButton>
                <ElButton
                    v-if="
                        !visita.isLoading &&
                        visita.data?.statusInt !== 1 &&
                        visita.data?.statusInt !== 4 &&
                        visita.data?.statusInt !== 5
                    "
                    @click="openCancelVisitaModal"
                    :disabled="visita.isSubmitting"
                    type="primary"
                >
                    Cancelar
                </ElButton>
                <ElButton
                    v-if="
                        !visita.isLoading &&
                        visita.data?.statusInt !== 1 &&
                        visita.data?.statusInt !== 4 &&
                        visita.data?.statusInt !== 5
                    "
                    @click="openReagendarVisitaModal"
                    :disabled="visita.isSubmitting"
                    type="primary"
                >
                    Reagendar
                </ElButton>
                <ElButton
                    v-if="
                        !visita.isLoading &&
                        visita.data?.statusInt !== 1 &&
                        visita.data?.statusInt !== 4 &&
                        visita.data?.statusInt !== 5
                    "
                    :disabled="visita.isSubmitting"
                    @click="openEndVisitaModal"
                    class="!mt-3 md:!mt-0"
                    type="primary"
                >
                    Concluir
                </ElButton>
                <ElButton
                    v-if="!visita.isLoading && visita.data?.statusInt === 1"
                    :disabled="visita.isSubmitting"
                    @click="handleVisitaStatus(2)"
                    type="primary"
                >
                    Iniciar
                </ElButton>
            </div>
        </template>
    </ElDialog>
    <!-- Modal de finalização -->
    <VisitaEndModal v-model="isEndOpen" />
    <!-- Modal de cancelamento -->
    <VisitaCancelModal v-model="isCancelOpen" />
    <!-- Modal de reagendamento -->
    <VisitaReagendarModal v-model="isReagendarOpen" />
</template>

<style>
.el-image__inner {
    opacity: 0.6;
}
</style>
