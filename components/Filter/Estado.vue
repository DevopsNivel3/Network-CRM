<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";

const estados = useEstados();

interface EstadoOption {
  label: string;
  value: number | string;
  estado_nome?: string;
}

const props = defineProps<{
  label?: string;
  value?: string | number;
  placeholder?: string;
  options?: EstadoOption[];
  haveAll?: boolean;
  showLabel?: boolean;
}>();
const localValue = computed({
  get: () => props.value,
  set: (value: any) => emit("change", value),
});

const emit = defineEmits<{
  change: [value: string];
}>();

const { isLoading, remoteSearch, filteredList } = useRemoteSearch(
  computed(() => {
    const options: EstadoOption[] = [];
    if (props.haveAll) options.push({ label: "Todos", value: "all" });
    if (props.options) options.push(...props.options);
    options.push(...estados.formattedOptions);
    return options;
  }),
  undefined,
  estados.findAll,
  estados.setFilterByName,
  200
);

const isUsed = ref<boolean>(false);
const findAllOnce = async (visible: boolean) => {
  if (visible && !isUsed.value) {
    await estados.findAll();
    isUsed.value = true;
  }
};
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <span v-if="props.showLabel" class="text-xs text-black/80 dark:text-white/80">
      {{ props.label ?? "Estado" }}
    </span>
    <ElSelectV2
      :placeholder="placeholder || 'Selecione um estado'"
      @change="(value: string) => emit('change', value)"
      @visible-change="findAllOnce"
      :remote-method="remoteSearch"
      :options="filteredList"
      v-model="localValue"
      :loading="isLoading"
      filterable
      remote
    >
      <template #default="{ item }">
        <div class="flex items-center justify-between relative">
          <span class="truncate mr-2">{{ item.label }}</span>
        </div>
      </template>
      <template #loading>
        <div class="flex items-center justify-center h-full w-full">
          <ElIcon class="is-loading" color="var(--el-color-primary)">
            <Loading />
          </ElIcon>
        </div>
      </template>
    </ElSelectV2>
  </div>
</template>
