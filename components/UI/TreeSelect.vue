<script setup lang="ts">
import type { PermissionModule } from "@/utils/permissions";

const props = defineProps<{
    modelValue: number[];
    disabledKeys?: number[];
    allowedModules?: PermissionModule[];
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: number[]): void;
}>();

const treeRef = ref();

const treeData = computed(() => {
    const disabled = new Set(props.disabledKeys || []);
    const mapNode = (node: any) => {
        const hasChildren =
            Array.isArray(node.children) && node.children.length;
        return {
            ...node,
            disabled: hasChildren ? false : disabled.has(node.key as number),
            children: hasChildren ? node.children.map(mapNode) : undefined,
        };
    };
    return getPermissionsTreeDataByModules(props.allowedModules).map(mapNode);
});

const collectExpandedKeys = (nodes: any[], checked: Set<number>) => {
    const expanded = new Set<string>();

    const walk = (node: any, parents: string[]) => {
        const hasChildren =
            Array.isArray(node.children) && node.children.length;
        if (hasChildren) {
            node.children.forEach((child: any) =>
                walk(child, [...parents, node.key]),
            );
            return;
        }

        if (checked.has(node.key)) {
            parents.forEach((key) => expanded.add(String(key)));
        }
    };

    nodes.forEach((node) => walk(node, []));
    return Array.from(expanded);
};

const syncChecked = () => {
    if (!treeRef.value) return;
    treeRef.value.setCheckedKeys(props.modelValue || []);
};

watch(
    () => props.modelValue,
    () => syncChecked(),
    { immediate: true },
);

const expandedKeys = computed(() =>
    collectExpandedKeys(treeData.value, new Set(props.modelValue || [])),
);

const handleCheck = () => {
    const keys = treeRef.value?.getCheckedKeys(true) || [];
    emit("update:modelValue", keys as number[]);
};
</script>

<template>
    <ElScrollbar class="!h-[320px] !w-full">
        <ElTree
            :key="expandedKeys.join('|')"
            ref="treeRef"
            :data="treeData"
            node-key="key"
            show-checkbox
            check-on-click-node
            :expand-on-click-node="false"
            :default-checked-keys="modelValue"
            :default-expanded-keys="expandedKeys"
            @check="handleCheck"
        />
    </ElScrollbar>
</template>
