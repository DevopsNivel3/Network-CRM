<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";

withDefaults(
    defineProps<{
        size?: number;
        containerClass?: string;
    }>(),
    {
        size: 25,
        containerClass: "absolute inset-0 flex items-center justify-center",
    },
);
</script>

<template>
    <div :class="containerClass">
        <ElIcon
            class="is-loading ui-loading-spin"
            color="var(--el-color-primary)"
            :size="size"
        >
            <Loading />
        </ElIcon>
    </div>
</template>

<style scoped>
.ui-loading-spin {
    animation: ui-loading-spin 1s linear infinite;
}

@keyframes ui-loading-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
