<script setup lang="ts">
import { ChatDotRound, Phone, Message, MessageBox, Calendar, Document } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";

const props = defineProps<{
  leadId: number;
}>();

const lead = useLead();
const interactions = useLeadInteractions();
const reminders = useReminders();

const formRef = ref<FormInstance | null>(null);
const followUpDate = ref<Date | null>(null);
const formData = reactive({
  tipo: "CALL" as "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "QUOTATION" | "NOTE",
  descricao: "",
});

const interactionTypeOptions = [
  { label: "Ligação", value: "CALL" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "E-mail", value: "EMAIL" },
  { label: "Reunião", value: "MEETING" },
  { label: "Cotação", value: "QUOTATION" },
  { label: "Observação", value: "NOTE" },
] as const;

const interactionTypeMeta = {
  CALL: { label: "Ligação", icon: Phone },
  WHATSAPP: { label: "WhatsApp", icon: Message },
  EMAIL: { label: "E-mail", icon: MessageBox },
  MEETING: { label: "Reunião", icon: Calendar },
  QUOTATION: { label: "Cotação", icon: Document },
  NOTE: { label: "Observação", icon: ChatDotRound },
} as const;

const formRules = reactive<FormRules>({
  tipo: [{ required: true, message: "Selecione o tipo da interação", trigger: "change" }],
  descricao: [{ required: true, message: "Descreva a interação", trigger: "blur" }],
});

const loadInteractions = async () => {
  interactions.page = 1;
  await interactions.fetchInteractions(props.leadId);
};

const applyFollowUp = async (payload: {
  intervalo_dias?: number | null;
  data?: string | null;
  limpar?: boolean;
}) => {
  const res = await lead.updateFollowUp(props.leadId, payload);
  if (!res) return;

  await Promise.all([lead.fetchLead(props.leadId), loadInteractions(), reminders.fetchReminders()]);
  ElMessage.success({
    message: payload.limpar
      ? "Follow-up removido com sucesso!"
      : "Próximo follow-up agendado com sucesso!",
    plain: true,
  });
};

const handleFollowUpByInterval = async (days: number) => {
  await applyFollowUp({ intervalo_dias: days });
};

const handleCustomFollowUpDate = async () => {
  if (!followUpDate.value) {
    ElMessage.warning({
      message: "Selecione uma data para o follow-up.",
      plain: true,
    });
    return;
  }

  await applyFollowUp({ data: followUpDate.value.toISOString() });
};

const clearFollowUp = async () => {
  await applyFollowUp({ limpar: true });
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    const res = await interactions.createInteraction(props.leadId, {
      tipo: formData.tipo,
      descricao: formData.descricao,
      origem: "MANUAL",
    });

    if (!res) return;

    ElMessage.success({
      message: "Interação registrada com sucesso!",
      plain: true,
    });

    formData.tipo = "CALL";
    formData.descricao = "";
    await Promise.all([loadInteractions(), lead.fetchLead(props.leadId), reminders.fetchReminders()]);
  } catch (err) {
    console.error(err);
  }
};

watch(
  () => props.leadId,
  async (newLeadId) => {
    if (newLeadId) {
      if (!reminders.intervalos.length) await reminders.fetchConfig();
      await loadInteractions();
    }
  },
  { immediate: true }
);

watch(
  () => lead.data?.proximo_followup_em,
  (value) => {
    followUpDate.value = value ? new Date(value) : null;
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-4">
    <UIDivider text="Interações e Follow-up" />

    <div class="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-4">
      <div class="bg-black/5 dark:bg-white/5 rounded p-4">
        <h3 class="font-medium mb-3">Próximo ciclo</h3>
        <div class="space-y-3 mb-5">
          <div class="text-xs text-black/60 dark:text-white/60">
            <template v-if="lead.data?.proximo_followup_em">
              Agendado para
              {{ $dayjs(lead.data.proximo_followup_em).format("DD/MM/YYYY [às] HH:mm") }}
            </template>
            <template v-else>Sem follow-up personalizado agendado.</template>
          </div>

          <div class="flex flex-wrap gap-2">
            <ElButton
              v-for="days in reminders.intervalos"
              :key="days"
              size="small"
              @click="handleFollowUpByInterval(days)"
              :loading="lead.isSubmitting"
            >
              {{ days }} dias
            </ElButton>
          </div>

          <div class="flex flex-col gap-2">
            <ElDatePicker
              v-model="followUpDate"
              type="datetime"
              placeholder="Selecionar data customizada"
              format="DD/MM/YYYY HH:mm"
              class="!w-full"
            />
            <div class="flex gap-2">
              <ElButton @click="handleCustomFollowUpDate" :loading="lead.isSubmitting">
                Salvar data
              </ElButton>
              <ElButton @click="clearFollowUp" :loading="lead.isSubmitting">
                Limpar
              </ElButton>
            </div>
          </div>
        </div>

        <h3 class="font-medium mb-3">Nova interação</h3>
        <ElForm
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-position="top"
          label-width="auto"
        >
          <ElFormItem label="Tipo" prop="tipo">
            <ElSelect v-model="formData.tipo" class="!w-full" placeholder="Selecione">
              <ElOption
                v-for="item in interactionTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="Descrição" prop="descricao">
            <ElInput
              v-model="formData.descricao"
              type="textarea"
              :rows="5"
              maxlength="1000"
              show-word-limit
              placeholder="Ex.: Cliente pediu retorno na próxima semana."
            />
          </ElFormItem>
          <ElButton
            type="primary"
            class="!w-full"
            :loading="interactions.isSubmitting"
            @click="handleSubmit"
          >
            Registrar interação
          </ElButton>
        </ElForm>
      </div>

      <div class="bg-black/5 dark:bg-white/5 rounded p-4">
        <div class="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 class="font-medium">Histórico</h3>
            <p class="text-xs text-black/60 dark:text-white/60">
              {{ interactions.total }} interação(ões) registradas
            </p>
          </div>
          <ElButton text @click="loadInteractions">Atualizar</ElButton>
        </div>

        <div v-if="interactions.isLoading" class="py-8 flex items-center justify-center">
          <span class="loading loading-infinity loading-md" />
        </div>

        <div
          v-else-if="!interactions.data.length"
          class="text-sm text-black/60 dark:text-white/60 border border-dashed dark:!border-white/20 rounded p-4"
        >
          Nenhuma interação registrada para este lead.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in interactions.data"
            :key="item.id"
            class="border dark:!border-white/10 rounded p-3 bg-white dark:bg-charcoal"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <ElIcon>
                  <component :is="interactionTypeMeta[item.tipo].icon" />
                </ElIcon>
                <span class="font-medium truncate">{{ interactionTypeMeta[item.tipo].label }}</span>
              </div>
              <span class="text-[11px] text-black/60 dark:text-white/60 text-right">
                {{ $dayjs(item.criado).format("DD/MM/YYYY [às] HH:mm") }}
              </span>
            </div>
            <p class="text-sm text-black/75 dark:text-white/75 whitespace-pre-wrap break-words">
              {{ item.descricao || "Sem descrição" }}
            </p>
            <p class="text-xs text-black/60 dark:text-white/60 mt-2">
              Registrado por {{ item.usuario?.nome || "Sistema" }}
            </p>
          </div>

          <div class="flex items-center justify-center pt-2">
            <ElPagination
              :current-page="interactions.page"
              :page-size="interactions.perPage"
              :total="interactions.total"
              layout="prev, pager, next"
              hide-on-single-page
              background
              @current-change="(page) => interactions.handlePageChange(page, props.leadId)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
