<script setup lang="ts">
const reminders = useReminders();

const urgencyMeta = {
  critico: { label: "Crítico", class: "bg-red-500/15 text-red-500" },
  alto: { label: "Alto", class: "bg-orange-500/15 text-orange-500" },
  medio: { label: "Médio", class: "bg-yellow-500/15 text-yellow-500" },
  baixo: { label: "Baixo", class: "bg-blue-500/15 text-blue-500" },
  planejado: { label: "Planejado", class: "bg-emerald-500/15 text-emerald-500" },
} as const;
</script>

<template>
  <div class="app-surface p-4 md:p-5">
    <div class="flex items-center justify-between mb-4 gap-2">
      <div>
        <h2 class="font-medium text-base">Fila de Lembretes</h2>
        <p class="text-xs text-black/60 dark:text-white/60">
          {{ reminders.total }} lead(s) na fila • ciclos {{ reminders.intervalos.join(", ") }}
        </p>
      </div>
      <NuxtLink to="/reminders">
        <ElButton text> Abrir central </ElButton>
      </NuxtLink>
    </div>

    <HomeReminderSettings class="mb-4" />

    <div v-if="reminders.isLoading" class="py-8 flex items-center justify-center">
      <span class="loading loading-infinity loading-md" />
    </div>

    <div
      v-else-if="!reminders.data.length"
      class="text-sm text-black/60 dark:text-white/60 border border-dashed dark:!border-white/20 rounded p-4"
    >
      Nenhum lembrete pendente no momento.
    </div>

    <div v-else class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
      <div
        v-for="item in reminders.data"
        :key="item.lead_id"
        class="bg-white dark:bg-charcoal border dark:!border-white/10 rounded p-3"
      >
        <div class="flex items-center justify-between gap-2 mb-1">
          <p class="font-medium truncate">{{ item.lead_nome }}</p>
            <span
              class="text-[11px] px-2 py-1 rounded-full"
              :class="urgencyMeta[item.nivel_urgencia].class"
            >
              {{ urgencyMeta[item.nivel_urgencia].label }}
            </span>
        </div>
        <div class="text-xs text-black/70 dark:text-white/70 flex flex-wrap gap-x-3 gap-y-1">
          <span>Sem interação: {{ item.dias_sem_interacao }} dia(s)</span>
          <span v-if="item.proximo_intervalo_dias">Próximo ciclo: {{ item.proximo_intervalo_dias }} dias</span>
          <span v-else-if="item.followup_personalizado">
            Follow-up agendado: {{ $dayjs(item.prazo_em).format("DD/MM/YYYY [às] HH:mm") }}
          </span>
          <span v-if="item.dias_em_atraso > 0">Atrasado: {{ item.dias_em_atraso }} dia(s)</span>
          <span v-if="item.contato_nome">Contato: {{ item.contato_nome }}</span>
          <span v-if="item.cidade">{{ item.cidade }} - {{ item.estado }}</span>
          <span>Responsável: {{ item.usuario.nome }}</span>
        </div>
        <div class="text-[11px] text-black/55 dark:text-white/55 mt-2">
          Última interação:
          {{ $dayjs(item.ultima_interacao.criado).format("DD/MM/YYYY [às] HH:mm") }}
        </div>
        <div class="mt-3">
          <NuxtLink :to="`/reminders?lead=${item.lead_id}`">
            <ElButton size="small">Abrir lead</ElButton>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

