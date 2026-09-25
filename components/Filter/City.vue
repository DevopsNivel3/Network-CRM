<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";

const cidades = useCidades();

interface CityOption {
  label: string;
  value: number | string;
  estado_nome?: string;
}

const props = defineProps<{
  label?: string;
  value?: string | number;
  placeholder?: string;
  options?: CityOption[];
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
    const options: CityOption[] = [];
    if (props.haveAll) options.push({ label: "Todos", value: "all" });
    if (props.options) options.push(...props.options);
    options.push(...cidades.formattedOptions);
    return options;
  }),
  undefined,
  cidades.findAll,
  cidades.setFilterByName,
  200
);

const isUsed = ref<boolean>(false);
const findAllOnce = async (visible: boolean) => {
  if (visible && !isUsed.value) {
    await cidades.findAll();
    isUsed.value = true;
  }
};
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <span v-if="props.showLabel" class="text-xs text-black/80 dark:text-white/80">
      {{ props.label ?? "Cidade" }}
    </span>
    <ElSelectV2
      :placeholder="placeholder || 'Selecione uma cidade'"
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
          <span
            class="text-xs text-[--el-text-color-secondary] !opacity-80"
            v-if="item.estado_nome"
          >
            {{ item.estado_nome }}
          </span>
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
