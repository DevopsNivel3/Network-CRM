<script setup lang="ts">
import type { Component } from "vue";
import { Loading, Setting, ChatLineRound, Cpu } from "@element-plus/icons-vue";

definePageMeta({
    requiredModule: Modules.CRM,
    requiredPermission: UserPermissions.ADMIN,
});

type IntegrationCard = {
    tipo: string;
    label: string;
    descricao: string;
    statusLabel: string;
    icon: Component;
};

const integracoes = useIntegracoes();
const isDataLoaded = ref(false);

const cards: IntegrationCard[] = [
    {
        tipo: "whatsapp",
        label: "WhatsApp",
        descricao: "Mensagens, templates e automações",
        statusLabel: "Configurar instância",
        icon: ChatLineRound,
    },
    {
        tipo: "network_ia",
        label: "Network IA",
        descricao: "Configurações de IA da plataforma",
        statusLabel: "Em breve",
        icon: Cpu,
    },
];

const integracoesList = computed(() => integracoes.data.data || []);

const selectedIntegration = ref<any | null>(null);
const whatsappDialogOpen = ref(false);

const handleOpenCard = (tipo: string) => {
    if (tipo === "whatsapp") {
        selectedIntegration.value =
            integracoesList.value.find((item) => item.tipo === "whatsapp") ||
            null;
        whatsappDialogOpen.value = true;
        return;
    }

    ElMessage.info({
        message: "Configuração em breve.",
        plain: true,
    });
};

onMounted(async () => {
    const res = await integracoes.findAll();
    isDataLoaded.value = !!res;
});
</script>

<template>
    <div class="flex flex-col h-full w-full overflow-hidden">
        <ElScrollbar view-class="!h-full !w-full">
            <div v-if="isDataLoaded" class="!grow !h-full p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ElCard
                        v-for="card in cards"
                        :key="card.tipo"
                        class="cursor-pointer hover:shadow-md transition"
                        @click="handleOpenCard(card.tipo)"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-start gap-3">
                                <ElIcon size="20" class="mt-0.5">
                                    <component :is="card.icon" />
                                </ElIcon>
                                <div>
                                    <h3 class="text-base font-semibold">
                                        {{ card.label }}
                                    </h3>
                                    <p class="text-xs text-black/60 dark:text-white/60">
                                        {{ card.descricao }}
                                    </p>
                                </div>
                            </div>
                            <ElButton type="primary" size="small" :icon="Setting">
                                {{ card.statusLabel }}
                            </ElButton>
                        </div>
                    </ElCard>
                </div>
            </div>

            <div v-else class="flex items-center justify-center !grow h-full w-full">
                <ElIcon class="is-loading" color="var(--el-color-primary)" size="25">
                    <Loading />
                </ElIcon>
            </div>
        </ElScrollbar>

        <IntegracoesWhatsappConfigDialog
            v-model="whatsappDialogOpen"
            :integration="selectedIntegration"
        />
    </div>
</template>
