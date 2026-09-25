<script setup lang="ts">
const { user } = useAuthSession();
const reminders = useReminders();

const isAdmin = computed(() => hasUserPermission(user.permissoes, UserPermissions.ADMIN));
const intervalInput = ref("");

const syncInput = () => {
  intervalInput.value = reminders.intervalos.join(", ");
};

const handleSave = async () => {
  const parsed = intervalInput.value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

  if (!parsed.length) {
    ElMessage.warning({
      message: "Informe os intervalos separados por vírgula.",
      plain: true,
    });
    return;
  }

  const res = await reminders.updateConfig(parsed);
  if (!res) return;

  syncInput();
  await reminders.fetchReminders();
  ElMessage.success({
    message: "Intervalos atualizados com sucesso!",
    plain: true,
  });
};

watch(
  () => reminders.intervalos,
  () => syncInput(),
  { immediate: true }
);
</script>

<template>
  <div class="app-surface p-4 md:p-5">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h3 class="font-medium">Intervalos de lembrete</h3>
        <p class="text-xs text-black/60 dark:text-white/60">
          Ciclos ativos: {{ reminders.intervalos.join(", ") || "sem configuração" }} dia(s)
        </p>
      </div>
      <p v-if="reminders.updatedAt" class="text-xs text-black/50 dark:text-white/50">
        Atualizado em {{ $dayjs(reminders.updatedAt).format("DD/MM/YYYY [às] HH:mm") }}
      </p>
    </div>

    <div v-if="isAdmin" class="mt-4 flex flex-col lg:flex-row gap-3">
      <ElInput
        v-model="intervalInput"
        placeholder="Ex.: 3, 7, 10, 15, 21"
        class="!w-full"
      />
      <ElButton type="primary" :loading="reminders.isSavingConfig" @click="handleSave">
        Salvar intervalos
      </ElButton>
    </div>

    <p v-else class="text-xs text-black/60 dark:text-white/60 mt-3">
      Apenas administradores podem alterar os intervalos.
    </p>
  </div>
</template>
