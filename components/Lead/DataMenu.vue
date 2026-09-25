<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const activePaneName = ref<string>("import");

const closeExportModal = () => {
    isOpen.value = false;
    setTimeout(() => (activePaneName.value = "import"), 200);
};
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[600px]"
        v-model="isOpen"
        @close="closeExportModal"
        destroy-on-close
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Importar / Exportar"
                @close="closeExportModal"
            />
        </template>
        <!-- Paineis -->
        <ElTabs
            class="!h-full !bg-transparent !w-full !border-[0.5px] !p-0 !border-black/10 dark:!border-white/10 !rounded !mt-2"
            v-model="activePaneName"
            type="border-card"
            :stretch="true"
        >
            <!-- Painel de Importação -->
            <ElTabPane
                label="Importar"
                name="import"
                class="!flex !flex-col !gap-2"
            >
                <div class="p-4" v-show="activePaneName === 'import'">
                    <LeadDataImport />
                </div>
            </ElTabPane>
            <!-- Painel de Exportação -->
            <ElTabPane
                label="Exportar"
                name="export"
                class="!flex !flex-col !gap-2"
            >
                <div class="p-4" v-show="activePaneName === 'export'">
                    <LeadDataExport />
                </div>
            </ElTabPane>
        </ElTabs>
    </ElDialog>
</template>
