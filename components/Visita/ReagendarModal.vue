<script setup lang="ts">
import type {
    FormInstance,
    CalendarDateType,
    CalendarInstance,
} from "element-plus";

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
const dayjs = useDayjs();

const formRef = ref<FormInstance | null>(null);
const formRules = reactive(FormReagendarVisitaRules);
const formData = reactive<FormVisitaCreate>({
    data_inicio: dayjs().toDate(),
    hora_inicio: dayjs().format("HH:mm:ss"),
    motivo: null,
});

// Fecha o modal
const closeReagendarModal = () => {
    if (formRef.value) formRef.value.resetFields();
    isOpen.value = false;
};

// Envia os dados para o backend
const handleSubmit = async () => {
    if (visita.isSubmitting) return;

    try {
        await formRef.value?.validate();

        ElMessageBox.confirm(
            h("p", null, [
                h(
                    "span",
                    null,
                    `Você está reagendando uma visita para o dia ${dayjs(
                        formData.data_inicio,
                    ).format(
                        "DD/MM/YYYY",
                    )} às ${formData?.hora_inicio?.slice(0, 5)}. `,
                ),
                h("span", null, `Deseja continuar?`),
            ]),
            "Atenção",
            {
                confirmButtonText: "Sim, reagendar!",
                cancelButtonText: "Cancelar",
                type: "info",
            },
        ).then(async () => {
            const visitaId = visita.data!.id;
            const isVisitaStatusSchuled = await visita.updateById(visitaId, {
                ...formData,
                statusInt: 3, // Reagendado,
            });

            if (isVisitaStatusSchuled) {
                ElMessage.success({
                    message: "Visita reagendada com sucesso!",
                    customClass: "!z-[2500]",
                    plain: true,
                });

                visitas.updateStatusFromState(visitaId, 3);
                if (oportunidade.hasVisitas)
                    oportunidade.updateVisitaFromState(visitaId, {
                        data_inicio: formData.data_inicio!.toString(),
                        hora_inicio: formData.hora_inicio,
                        statusInt: 3,
                    });

                closeReagendarModal();
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

// Função para verificar se o dia do input é anterior ao dia atual (hoje)
// const isPastDate = (value: Date | string) => {
//   const today = dayjs().startOf("day").subtract(1, "day");
//   const inputDate = dayjs(value).startOf("day");
//   return inputDate.isBefore(today, "day");
// };
</script>

<template>
    <ElDialog
        v-model="isOpen"
        class="!w-full md:!w-[480px]"
        @close="closeReagendarModal"
        title="Reagendar Visita"
        destroy-on-close
        :z-index="1510"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Reagendar Visita"
                @close="closeReagendarModal"
            />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
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
            <!-- Horário do Reagendamento -->
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
            <!-- Motivo do reagendamento -->
            <ElFormItem label="Informe o motivo" prop="motivo" class="w-full">
                <ElInput
                    :disabled="visita.isSubmitting"
                    placeholder="Escreva um motivo"
                    :maxlength="maxLengthTextarea"
                    v-model="formData.motivo"
                    show-word-limit
                    type="textarea"
                />
            </ElFormItem>
        </ElForm>
        <!-- Grupo de botão do footer -->
        <template #footer>
            <ElButton @click="closeReagendarModal">Fechar</ElButton>
            <ElButton
                :disabled="visita.isSubmitting"
                @click="handleSubmit"
                type="primary"
            >
                Sim, reagendar!
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
