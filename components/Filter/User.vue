<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";

const usuarios = useUsuarios();

interface UsuarioOption {
  label: string;
  value: string | number;
}

const props = defineProps<{
  label?: string;
  value?: string | number;
  placeholder?: string;
  options?: UsuarioOption[];
  haveAll?: boolean;
  showLabel?: boolean;
}>();
const localValue = computed({
  get: () => props.value,
  set: (value: any) => emit("change", value),
});

const emit = defineEmits<{
  change: [value: string | number];
}>();

const { isLoading, remoteSearch, filteredList } = useRemoteSearch(
  computed(() => {
    const options: UsuarioOption[] = [];
    if (props.haveAll) options.push({ label: "Todos", value: "all" });
    if (props.options) options.push(...props.options);
    options.push(...usuarios.formattedOptions);
    return options;
  }),
  undefined,
  usuarios.findAll,
  usuarios.setFilterByName,
  200
);

const isUsed = ref<boolean>(false);
const findAllOnce = async (visible: boolean) => {
  if (visible && !isUsed.value) {
    await usuarios.findAll();
    isUsed.value = true;
  }
};
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <span v-if="props.showLabel" class="text-xs text-black/80 dark:text-white/80">
      {{ props.label ?? "Usuário" }}
    </span>
    <ElSelectV2
      :placeholder="placeholder || 'Selecione um usuário'"
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
