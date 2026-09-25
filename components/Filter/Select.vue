<script setup lang="ts">
interface CustomOption {
  label: string;
  value: string | number;
}

const props = defineProps<{
  label?: string;
  value?: string | number;
  placeholder?: string;
  options?: CustomOption[];
  haveAll?: boolean;
}>();

const localValue = computed({
  get: () => props.value,
  set: (value: any) => emit("change", value),
});

const emit = defineEmits<{
  change: [value: string | number];
}>();

const customOptions = computed(() => {
  const options: CustomOption[] = [];
  if (props.haveAll) options.push({ label: "Todos", value: "all" });
  if (props.options) options.push(...props.options);
  return options;
});
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <span class="text-xs text-black/80 dark:text-white/80">
      {{ props.label ?? "Status" }}
    </span>
    <ElSelectV2
      :placeholder="props.placeholder || 'Selecione um status'"
      @change="(value) => emit('change', value)"
      :options="customOptions"
      v-model="localValue"
    >
      <template #default="{ item }">
        <div class="flex items-center justify-between relative">
          <span class="truncate mr-2">{{ item.label }}</span>
        </div>
      </template>
    </ElSelectV2>
  </div>
</template>
