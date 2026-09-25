<script setup lang="ts">
import type {
    FormInstance,
    CalendarDateType,
    CalendarInstance,
} from "element-plus";
import { Plus } from "@element-plus/icons-vue";

interface VisitaCreateModalProps {
    modelValue: boolean;
    showOportunidadeSelect?: boolean;
}

const oportunidades = useOportunidades();
const oportunidade = useOportunidade();
const visitas = useVisitas();
const visita = useVisita();
const props = defineProps<VisitaCreateModalProps>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});
const dayjs = useDayjs();

const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormCreateVisitaRules);
const formData = reactive<FormVisitaCreate>({
    data_inicio: dayjs().toDate(),
    hora_inicio: dayjs().format("HH:mm:ss"),
    localizacao_id: null,
    oportunidade_id: null,
});

// Fecha o modal
const closeCreateModal = () => {
    if (formRef.value) formRef.value.resetFields();
    resetFormData(formData);
    isOpen.value = false;
};

// Função para enviar os dados ao backend
const handleCreate = async () => {
    if (visita.isSubmitting) return;

    try {
        await formRef.value?.validate();

        ElMessageBox.confirm(
            h("p", null, [
                h(
                    "span",
                    null,
                    `Você está agendando uma visita para o dia ${dayjs(
                        formData.data_inicio,
                    ).format(
                        "DD/MM/YYYY",
                    )} às ${formData?.hora_inicio?.slice(0, 5)}. `,
                ),
                h("span", null, `Deseja continuar?`),
            ]),
            "Atenção",
            {
                confirmButtonText: "Sim, agendar!",
                cancelButtonText: "Cancelar",
                type: "info",
            },
        ).then(async () => {
            const isVisitaCreated = await visita.create(formData);

            if (isVisitaCreated) {
                ElMessage.success({
                    message: "Visita agendada com sucesso!",
                    plain: true,
                });

                if (props.showOportunidadeSelect) visitas.findAll();
                else if (!props.showOportunidadeSelect)
                    oportunidade.addVisitaFromState(isVisitaCreated);
                closeCreateModal();
            }
        });
    } catch (err) {
        console.error(err);
    }
};

// Para modificar o calendário
const calendarRef = ref<CalendarInstance>();
const selectDate = (val: CalendarDateType) => {
    if (!calendarRef.value) return;
    calendarRef.value.selectDate(val);
};

// Endereços formatados para select
const localizacaoSelectOptions = computed(() => {
    const oportunidade_id = formData.oportunidade_id;
    const oportunidadeData = props.showOportunidadeSelect
        ? oportunidades.getOportunidadeFromState(oportunidade_id)
        : oportunidade.data;
    return oportunidadeData?.lead.localizacoes
        ?.filter((loc: any) =>
            [loc.rua, loc.numero, loc.cidade, loc.estado, loc.cep].some(
                (v) => v && v.trim() !== "",
            ),
        )
        .map((loc: any) => ({
            label: [
                loc.rua,
                loc.numero ? `Nº ${loc.numero}` : null,
                loc.cidade,
                loc.estado,
                loc.cep ? formatCep(loc.cep) : null,
            ]
                .filter(Boolean)
                .join(", "),
            value: loc.id,
        }));
});

// Função para verificar se o dia do input é anterior ao dia atual (hoje)
// const isPastDate = (value: Date | string) => {
//   const today = dayjs().startOf("day").subtract(1, "day");
//   const inputDate = dayjs(value).startOf("day");
//   return inputDate.isBefore(today, "day");
// };

// Reseta os dados do form
const resetFormData = (data: any) => {
    if (!data) return;

    Object.assign(formData, {
        data_inicio: data.data_inicio,
        hora_inicio: data.hora_inicio,
        localizacao_id: data.localizacao_id,
        oportunidade_id: data.oportunidade_id,
    });
};

// Limpa a localização selecionada ao mudar de oportunidade
watch(
    () => formData.oportunidade_id,
    (isOpen) => {
        if (isOpen) formData.localizacao_id = null;
    },
);

watch(
    () => isOpen.value,
    (isOpen) => {
        if (isOpen) {
            resetFormData(formData);
            if (
                !formData.oportunidade_id &&
                !props.showOportunidadeSelect &&
                oportunidade.data?.id
            )
                formData.oportunidade_id = oportunidade.data.id;
        }
    },
);
</script>

<template>
    <ElDialog
        v-model="isOpen"
        title="Agendamento de Visita"
        class="!w-full md:!w-[480px]"
        @close="closeCreateModal"
        destroy-on-close
        :z-index="1510"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Agendamento de Visita"
                @close="closeCreateModal"
            />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <!-- Oportunidade -->
            <ElFormItem
                v-if="props.showOportunidadeSelect"
                prop="oportunidade_id"
                label="Oportunidade"
                class="w-full"
                required
            >
                <FilterOportunidade
                    @change="(value) => (formData.oportunidade_id = value)"
                    :value="formData.oportunidade_id"
                    :showLabel="false"
                    largeSelect
                />
            </ElFormItem>
            <!-- Localização/Endereço -->
            <ElFormItem
                prop="localizacao_id"
                label="Endereço"
                class="w-full"
                required
            >
                <ElSelectV2
                    :disabled="
                        Boolean(
                            !formData.oportunidade_id && showOportunidadeSelect,
                        )
                    "
                    :options="localizacaoSelectOptions || []"
                    placeholder="Selecione o endereço"
                    v-model="formData.localizacao_id"
                    size="large"
                    filterable
                />
            </ElFormItem>
            <!-- Calendário -->
            <ElFormItem prop="data_inicio" class="w-full" required>
                <ElCalendar
                    ref="calendarRef"
                    v-model="formData.data_inicio"
                    @onChange="selectDate"
                >
                    <template #header="{ date }">
                        {{ date }}
                        <ElButtonGroup>
                            <ElButton size="small" @click="selectDate('today')">
                                Hoje
                            </ElButton>
                            <ElButton
                                size="small"
                                @click="selectDate('next-month')"
                            >
                                Próximo mês
                            </ElButton>
                        </ElButtonGroup>
                    </template>
                    <template #date-cell="{ data }">
                        <p
                            class="flex flex-col-reverse md:flex-row items-center justify-center h-full w-full"
                            :class="[
                                data.isSelected
                                    ? // && !isPastDate(new Date(data.day))
                                      'text-nivel border border-nivel'
                                    : '',
                                // isPastDate(new Date(data.day)) ? 'past-date' : '',
                            ]"
                        >
                            {{ data.day.slice(-2) }}
                        </p>
                    </template>
                </ElCalendar>
            </ElFormItem>
            <!-- Horário -->
            <ElFormItem
                label="Horário"
                prop="hora_inicio"
                class="w-full"
                required
            >
                <ElTimePicker
                    placeholder="Selecione o horário"
                    v-model="formData.hora_inicio"
                    value-format="HH:mm"
                    :clearable="false"
                    :editable="false"
                    class="!w-full"
                    format="HH:mm"
                    size="large"
                />
            </ElFormItem>
        </ElForm>
        <!-- Grupo de botão do footer -->
        <template #footer>
            <ElButton @click="closeCreateModal">Cancelar</ElButton>
            <ElButton
                :disabled="visita.isSubmitting"
                @click="handleCreate"
                type="primary"
                :icon="Plus"
            >
                Agendar
            </ElButton>
        </template>
    </ElDialog>
</template>

<style>
.el-calendar__body {
    margin: 0 0 8px 0 !important;
    padding: 0 !important;
}
.el-calendar__header {
    padding: 12px 0 !important;
}
.el-calendar-day {
    padding: 0 !important;
}
.el-calendar {
    --el-calendar-cell-width: 50px !important;
}
@media only screen and (min-width: 768px) {
    .el-calendar {
        --el-calendar-cell-width: 60px !important;
    }
}
</style>

<!--
Para esconder os dias anteriores ao de hoje no calendário

.prev:has(.past-date),
.current:has(.past-date) {
  position: relative !important;
  pointer-events: none !important;
  user-select: none !important;
  opacity: 0.3 !important;
}
.prev:has(.past-date)::after,
.current:has(.past-date)::after {
  content: "";
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  pointer-events: none !important;
  z-index: 1 !important;
}
-->
