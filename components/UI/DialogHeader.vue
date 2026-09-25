<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";

defineProps<{
    title: string;
}>();

defineEmits<{
    (e: "close"): void;
}>();
</script>

<template>
    <div class="flex items-center justify-between w-full">
        <span class="text-base font-semibold tracking-tight text-gray-900 dark:text-white/90">{{ title }}</span>
        <div class="flex items-center gap-2">
            <div class="flex items-center mr-2">
                <slot name="actions" />
            </div>
            <ElButton
                type="default"
                :icon="Close"
                circle
                @click="$emit('close')"
            />
        </div>
    </div>
</template>
