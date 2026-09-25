<script setup lang="ts">
import dayjs from "dayjs";
import { Download } from "@element-plus/icons-vue";

type BoardOption = { id: number; titulo: string; cor?: string | null };

const device = useDevice();
const stats = useStats();
const isOpen = ref(false);
const isExporting = ref(false);
const isLoadingBoards = ref(false);
const boardIds = ref<number[]>([]);
const boards = ref<BoardOption[]>([]);
const dateRange = ref<string[]>([]);

async function open() {
  dateRange.value =
    stats.filterByBetweenDates?.length === 2
      ? [...stats.filterByBetweenDates]
      : [
          dayjs().startOf("month").format("YYYY-MM-DD"),
          dayjs().endOf("month").format("YYYY-MM-DD"),
        ];
  isOpen.value = true;

  if (boards.value.length || isLoadingBoards.value) return;
  isLoadingBoards.value = true;
  try {
    boards.value = await useApi<BoardOption[]>("/api/oportunidades/board", {
      method: "GET",
    });
  } catch (error: any) {
    stats.setError(error?.data?.message || "Erro ao carregar os boards");
  } finally {
    isLoadingBoards.value = false;
  }
}

async function exportDashboard() {
  isExporting.value = true;
  try {
    const { token } = useAuth();
    const { headerName, csrf } = useCsrf();
    const response = await fetch("/api/stats/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.value!,
        [headerName]: csrf,
      },
      body: JSON.stringify({
        ...stats.buildQueryParams(),
        ...(dateRange.value.length === 2
          ? { startDate: dateRange.value[0], endDate: dateRange.value[1] }
          : {}),
        boardIds: boardIds.value,
      }),
    });

    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.message || "Erro ao exportar o dashboard");
    }

    const disposition = response.headers.get("Content-Disposition");
    const filename =
      disposition?.match(/filename="(.+)"/)?.[1] ?? "dashboard_crm.xlsx";
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    ElMessage.success({
      message: "Planilha exportada com sucesso!",
      customClass: "!z-[2500]",
      plain: true,
    });
    isOpen.value = false;
  } catch (error: any) {
    stats.setError(error?.message || "Erro ao exportar o dashboard");
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <ElTooltip
    content="Exportar dashboard em Excel"
    :disabled="device.isMobile"
    placement="bottom"
    :hide-after="0"
    effect="light"
  >
    <ElButton @click="open" :loading="isExporting" class="w-full md:w-auto">
      <ElIcon class="hidden md:block"><Download /></ElIcon>
      <span class="block md:hidden mr-2">Exportar Excel</span>
    </ElButton>
  </ElTooltip>

  <ElDialog
    v-model="isOpen"
    title="Relatório gerencial do CRM"
    width="min(620px, 94vw)"
    append-to-body
    destroy-on-close
  >
    <div class="space-y-5">
      <div
        class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100"
      >
        Relatório consolidado em 6 abas filtráveis: resumo, equipe, pranchetas,
        oportunidades, interações e fluxo com motivos.
      </div>

      <div>
        <label
          class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Período do relatório
        </label>
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          range-separator="até"
          start-placeholder="Data inicial"
          end-placeholder="Data final"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          unlink-panels
          class="!w-full"
        />
      </div>

      <div>
        <label
          class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Boards incluídos
        </label>
        <ElSelect
          v-model="boardIds"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
          filterable
          :loading="isLoadingBoards"
          placeholder="Todos os boards"
          class="!w-full"
        >
          <ElOption
            v-for="board in boards"
            :key="board.id"
            :label="board.titulo"
            :value="board.id"
          >
            <div class="flex items-center gap-2">
              <span
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: board.cor || '#3b82f6' }"
              />
              <span>{{ board.titulo }}</span>
            </div>
          </ElOption>
        </ElSelect>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Vazio inclui todo o funil; selecione boards para um relatório
          direcionado.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="isOpen = false">Cancelar</ElButton>
        <ElButton
          type="primary"
          :loading="isExporting"
          @click="exportDashboard"
        >
          <ElIcon class="mr-2"><Download /></ElIcon>
          Gerar Excel
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
