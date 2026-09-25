<script setup lang="ts">
const route = useRoute();
const reminders = useReminders();
const lead = useLead();
const dialog = useDialog();

const urgencyMeta = {
  critico: { label: "Crítico", class: "bg-red-500/15 text-red-500" },
  alto: { label: "Alto", class: "bg-orange-500/15 text-orange-500" },
  medio: { label: "Médio", class: "bg-yellow-500/15 text-yellow-500" },
  baixo: { label: "Baixo", class: "bg-blue-500/15 text-blue-500" },
  planejado: { label: "Planejado", class: "bg-emerald-500/15 text-emerald-500" },
} as const;

const openLead = async (leadId: number) => {
  const res = await lead.fetchLead(leadId);
  if (!res) {
    ElMessage.error({
      message: lead.error || "Não foi possível abrir o lead.",
      plain: true,
    });
    return;
  }

  dialog.open("view_lead");
};

onMounted(async () => {
  await Promise.all([reminders.fetchConfig(), reminders.fetchReminders()]);
});

watch(
  () => route.query.lead,
  async (leadId) => {
    const parsedLeadId = Number(leadId);
    if (Number.isFinite(parsedLeadId) && parsedLeadId > 0) await openLead(parsedLeadId);
  },
  { immediate: true }
);
</script>

<template>
  <div class="p-4 md:p-6 space-y-4">
    <div
      class="app-surface flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5"
    >
      <div>
        <h1 class="text-lg font-medium">Central de Lembretes</h1>
        <p class="text-sm text-black/60 dark:text-white/60">
          Acompanhe leads sem interação e registre novos follow-ups pelo lead.
        </p>
      </div>
      <ElButton @click="reminders.fetchReminders" :loading="reminders.isLoading">
        Atualizar fila
      </ElButton>
    </div>

    <HomeReminderSettings />

    <div class="app-surface p-4 md:p-5">
      <div class="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 class="font-medium">Fila priorizada</h2>
          <p class="text-xs text-black/60 dark:text-white/60">
            {{ reminders.total }} lead(s) encontrados
          </p>
        </div>
      </div>

      <div v-if="reminders.isLoading" class="py-10 flex items-center justify-center">
        <span class="loading loading-infinity loading-lg" />
      </div>

      <div
        v-else-if="!reminders.data.length"
        class="text-sm text-black/60 dark:text-white/60 border border-dashed dark:!border-white/20 rounded p-4"
      >
        Nenhum lembrete pendente no momento.
      </div>

      <div v-else class="overflow-x-auto">
        <ElTable :data="reminders.data" empty-text="Sem dados para exibir.">
          <ElTableColumn label="Lead" min-width="240">
            <template #default="scope">
              <div class="flex flex-col">
                <span class="font-medium">{{ scope.row.lead_nome }}</span>
                <span class="text-xs text-black/60 dark:text-white/60">
                  {{ scope.row.contato_nome || "Sem contato" }}
                </span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="Urgência" min-width="120">
            <template #default="scope">
              <span
                class="text-[11px] px-2 py-1 rounded-full"
                :class="urgencyMeta[scope.row.nivel_urgencia].class"
              >
                {{ urgencyMeta[scope.row.nivel_urgencia].label }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="Dias sem interação" min-width="150">
            <template #default="scope">
              {{ scope.row.dias_sem_interacao }} dia(s)
            </template>
          </ElTableColumn>
          <ElTableColumn label="Atraso" min-width="120">
            <template #default="scope">
              {{ scope.row.dias_em_atraso }} dia(s)
            </template>
          </ElTableColumn>
          <ElTableColumn label="Próximo ciclo" min-width="130">
            <template #default="scope">
              <template v-if="scope.row.followup_personalizado">
                {{ $dayjs(scope.row.prazo_em).format("DD/MM/YYYY HH:mm") }}
              </template>
              <template v-else>
                {{ scope.row.proximo_intervalo_dias || "-" }}
              </template>
            </template>
          </ElTableColumn>
          <ElTableColumn label="Responsável" min-width="180">
            <template #default="scope">
              {{ scope.row.usuario.nome }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="Última interação" min-width="180">
            <template #default="scope">
              {{ $dayjs(scope.row.ultima_interacao.criado).format("DD/MM/YYYY HH:mm") }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="Cidade" min-width="140">
            <template #default="scope">
              {{ scope.row.cidade ? `${scope.row.cidade} - ${scope.row.estado}` : "-" }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="Ações" min-width="120" fixed="right">
            <template #default="scope">
              <ElButton size="small" @click="openLead(scope.row.lead_id)">Abrir lead</ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <div class="w-full flex items-center justify-center pt-4">
        <ElPagination
          :current-page="reminders.page"
          :page-size="reminders.perPage"
          :total="reminders.total"
          layout="prev, pager, next"
          hide-on-single-page
          background
          @current-change="reminders.handlePageChange"
        />
      </div>
    </div>
    <LeadViewModal />
  </div>
</template>
