<script setup lang="ts">
import dayjs from "dayjs";
import {
  Bell,
  Check,
  MessageBox,
  UserFilled,
} from "@element-plus/icons-vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const router = useRouter();
const device = useDevice();
const notifications = useNotifications();
const filter = ref<"all" | "oportunidade_interacao" | "oportunidade_atribuida">(
  "all",
);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const drawerSize = computed(() => (device.isMobile ? "100%" : 420));

const typeConfig: Record<
  string,
  {
    label: string;
    type: "" | "primary" | "success" | "warning" | "danger" | "info";
    icon: any;
  }
> = {
  oportunidade_interacao: {
    label: "Interação",
    type: "primary",
    icon: MessageBox,
  },
  oportunidade_atribuida: {
    label: "Atribuição",
    type: "warning",
    icon: UserFilled,
  },
};

const getTypeConfig = (tipo: string) =>
  typeConfig[tipo] || {
    label: "Notificação",
    type: "info",
    icon: Bell,
  };

const formatCreatedAt = (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm");

const filterOptions = [
  { label: "Todas", value: "all" },
  { label: "Interação", value: "oportunidade_interacao" },
  { label: "Atribuição", value: "oportunidade_atribuida" },
] as const;

const filteredNotifications = computed(() => {
  if (filter.value === "all") return notifications.items;
  return notifications.items.filter((item) => item.tipo === filter.value);
});

const groupedNotifications = computed(() => {
  const groups = new Map<
    string,
    {
      label: string;
      items: NotificationItem[];
      order: number;
    }
  >();

  filteredNotifications.value.forEach((item) => {
    const createdAt = dayjs(item.criado);
    const key = createdAt.format("YYYY-MM-DD");
    let label = createdAt.format("DD/MM/YYYY");

    if (createdAt.isSame(dayjs(), "day")) {
      label = "Hoje";
    } else if (createdAt.isSame(dayjs().subtract(1, "day"), "day")) {
      label = "Ontem";
    }

    const current = groups.get(key) || {
      label,
      items: [],
      order: createdAt.startOf("day").valueOf(),
    };

    current.items.push(item);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .sort((a, b) => b[1].order - a[1].order)
    .map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items.sort(
        (a, b) => dayjs(b.criado).valueOf() - dayjs(a.criado).valueOf(),
      ),
    }));
});

const openNotification = async (item: NotificationItem) => {
  await notifications.markAsRead(item.id);
  if (item.link) await router.push(item.link);
  isOpen.value = false;
};

watch(
  () => isOpen.value,
  async (open) => {
    if (!open) return;
    await notifications.refresh();
  },
);
</script>

<template>
  <ElDrawer
    v-model="isOpen"
    direction="rtl"
    :size="drawerSize"
    :with-header="false"
    class="notifications-center-drawer"
  >
    <div class="h-full min-h-0 flex flex-col overflow-hidden px-4 py-4 md:px-5">
      <div
        class="flex flex-col items-start justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4 sm:flex-row sm:items-center"
      >
        <div class="min-w-0 w-full sm:w-auto">
          <h3 class="text-base font-semibold text-black/80 dark:text-white/90 break-words">
            Notificações
          </h3>
          <p class="text-xs text-black/60 dark:text-white/60 mt-1 break-words">
            Interações e atribuições das suas oportunidades.
          </p>
        </div>
        <ElButton
          v-if="notifications.unreadCount > 0"
          size="small"
          class="w-full sm:w-auto sm:shrink-0"
          @click="notifications.markAllAsRead"
        >
          <ElIcon class="mr-1">
            <Check />
          </ElIcon>
          Marcar tudo
        </ElButton>
      </div>

      <div class="flex items-center gap-2 mt-4 flex-wrap">
        <ElTag
          v-for="option in filterOptions"
          :key="option.value"
          effect="plain"
          class="cursor-pointer max-w-full"
          :type="filter === option.value ? 'primary' : 'info'"
          @click="filter = option.value"
        >
          {{ option.label }}
        </ElTag>
      </div>

      <ElScrollbar class="flex-1 min-h-0 mt-4">
        <div class="space-y-4 pb-4 pr-1">
          <div
            v-if="!groupedNotifications.length && !notifications.isLoading"
            class="h-full min-h-[240px] flex items-center justify-center"
          >
            <ElEmpty description="Nenhuma notificação encontrada" />
          </div>

          <section
            v-for="group in groupedNotifications"
            :key="group.key"
            class="space-y-3"
          >
            <div class="sticky top-0 z-[1] py-1 bg-white/95 dark:bg-ebano/95 backdrop-blur-sm">
              <h4
                class="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50"
              >
                {{ group.label }}
              </h4>
            </div>

            <div
              v-for="item in group.items"
              :key="item.id"
              class="rounded-xl border p-3 md:p-4 transition-colors cursor-pointer overflow-hidden"
              :class="
                item.lida
                  ? 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5'
                  : 'border-nivel/30 bg-nivel/5 dark:bg-nivel/10'
              "
              @click="openNotification(item)"
            >
              <div class="flex items-start gap-3 min-w-0">
                <div
                  class="rounded-full size-9 flex items-center justify-center shrink-0 bg-black/5 dark:bg-white/10"
                >
                  <ElIcon>
                    <component :is="getTypeConfig(item.tipo).icon" />
                  </ElIcon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <ElTag
                      size="small"
                      :type="getTypeConfig(item.tipo).type"
                      effect="plain"
                      class="max-w-full"
                    >
                      {{ getTypeConfig(item.tipo).label }}
                    </ElTag>
                    <span
                      v-if="!item.lida"
                      class="inline-flex size-2 rounded-full bg-red-500 shrink-0"
                    />
                  </div>
                  <h4
                    class="text-sm font-semibold mt-2 text-black/80 dark:text-white/90 break-words"
                  >
                    {{ item.titulo }}
                  </h4>
                  <div
                    class="text-sm mt-1 text-black/65 dark:text-white/70 leading-relaxed break-words whitespace-pre-wrap"
                  >
                    {{ item.mensagem }}
                  </div>
                  <div class="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span class="text-xs text-black/50 dark:text-white/50 break-words">
                      {{ formatCreatedAt(item.criado) }}
                    </span>
                    <ElButton
                      v-if="!item.lida"
                      size="small"
                      text
                      class="!ml-0"
                      @click.stop="notifications.markAsRead(item.id)"
                    >
                      Marcar como lida
                    </ElButton>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </ElScrollbar>
    </div>
  </ElDrawer>
</template>

<style scoped>
:deep(.notifications-center-drawer .el-drawer__body) {
  padding: 0;
  overflow: hidden;
}
</style>
