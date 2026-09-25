<script setup lang="ts">
import { Plus, Connection, Picture } from "@element-plus/icons-vue";

const props = defineProps<{
    modelValue: boolean;
    integration: { config?: Record<string, any> | null } | null;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const { whatsapp } = useIntegracao();
const integracoes = useIntegracoes();

const integrationData = computed(() => {
    const list = integracoes.data.data || [];
    if (props.integration?.id) {
        return (
            list.find((item) => item.id === props.integration?.id) ||
            props.integration
        );
    }
    return list.find((item) => item.tipo === "whatsapp") || props.integration;
});

const dialogOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

const saving = ref(false);
const qrVisible = ref(false);
const statusPoll = ref<number | null>(null);

const form = reactive({
    instance_name: "",
    instance_id: "",
    webhook_url: "",
});

const statusValue = computed(() => whatsapp.instance.statusValue || "");
const infoData = computed(() => whatsapp.instance.infoData);
const integrationEnabled = computed(
    () => integrationData.value?.enabled === true,
);
const hasInstance = computed(() => !!form.instance_name || !!form.instance_id);
const isConnected = computed(() => {
    const statusSource = statusValue.value || infoData.value?.connectionStatus;
    if (!statusSource) return false;
    const status = String(statusSource).toLowerCase();
    return (
        status.includes("open") ||
        status.includes("connected") ||
        status.includes("online") ||
        status.includes("ready")
    );
});

const syncForm = () => {
    const config = (integrationData.value?.config || {}) as Record<string, any>;
    form.instance_name = config.instance_name || "";
    form.instance_id = config.instance_id || "";
    form.webhook_url = config.webhook_url || "";
};

const startStatusPoll = () => {
    if (!hasInstance.value || !integrationEnabled.value) return;
    if (statusPoll.value) return;
    whatsapp.instance.status();
    statusPoll.value = window.setInterval(async () => {
        await whatsapp.instance.status();
        if (
            qrVisible.value &&
            !whatsapp.instance.qrcodeValue &&
            !isConnected.value
        ) {
            await whatsapp.instance.qrcode();
        }
        if (isConnected.value) await whatsapp.instance.info();
    }, 5000);
};

const stopStatusPoll = () => {
    if (statusPoll.value) {
        window.clearInterval(statusPoll.value);
        statusPoll.value = null;
    }
};

watch(
    () => dialogOpen.value,
    (open) => {
        if (open) {
            qrVisible.value = false;
            syncForm();
            startStatusPoll();
        } else {
            stopStatusPoll();
        }
    },
);

const handleCreateInstance = async () => {
    if (saving.value) return;
    saving.value = true;
    try {
        await whatsapp.instance.create();
        await integracoes.findAll();
        syncForm();
        startStatusPoll();
        ElMessage.success({
            message: "Instância criada e configurações salvas.",
            plain: true,
        });
    } catch (err) {
        console.error(err);
    } finally {
        saving.value = false;
    }
};

const handleConnect = async () => {
    if (!hasInstance.value) return;
    if (!integrationEnabled.value) {
        ElMessage.warning({
            message: "WhatsApp não configurado para esta empresa.",
            plain: true,
        });
        return;
    }
    qrVisible.value = true;
    await whatsapp.instance.qrcode();
    await whatsapp.instance.status();
};

watch(
    () => isConnected.value,
    (connected) => {
        if (connected) {
            qrVisible.value = false;
            stopStatusPoll();
            whatsapp.instance.info(true);
        }
    },
);

onBeforeUnmount(() => stopStatusPoll());
</script>

<template>
    <ElDialog
        v-model="dialogOpen"
        class="!w-full md:!w-[520px]"
        title="Configurar WhatsApp"
        destroy-on-close
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader
                title="Configurar WhatsApp"
                @close="() => (dialogOpen = false)"
            />
        </template>

        <div class="flex flex-col gap-4">
            <div
                v-if="!hasInstance"
                class="flex flex-col items-center justify-center py-6 gap-3 text-center"
            >
                <p class="text-sm text-black/60 dark:text-white/60">
                    Crie uma instância para habilitar a integração.
                </p>
                <ElButton
                    type="primary"
                    size="small"
                    :icon="Plus"
                    :loading="saving"
                    @click="handleCreateInstance"
                >
                    Criar instância
                </ElButton>
            </div>

            <div v-else class="flex flex-col gap-4">
                <div class="flex items-center justify-center">
                    <ElTag
                        effect="dark"
                        :type="isConnected ? 'success' : 'info'"
                    >
                        {{
                            isConnected
                                ? "Conectado"
                                : statusValue || "Aguardando conexão"
                        }}
                    </ElTag>
                </div>

                <div
                    v-if="!isConnected"
                    class="flex flex-col items-center gap-3"
                >
                    <ElButton
                        type="primary"
                        size="small"
                        :icon="Connection"
                        @click="handleConnect"
                    >
                        Conectar
                    </ElButton>
                    <span class="text-xs text-black/60 dark:text-white/60">
                        Clique para gerar o QR Code e parear o WhatsApp.
                    </span>
                </div>

                <div
                    v-if="qrVisible && !isConnected"
                    class="flex flex-col items-center gap-2"
                >
                    <div class="text-sm font-medium">WhatsApp</div>
                    <ElIcon size="20"><Picture /></ElIcon>
                    <img
                        v-if="whatsapp.instance.qrcodeValue"
                        :src="whatsapp.instance.qrcodeValue"
                        alt="QR Code"
                        class="w-56 h-56 object-contain"
                    />
                    <div
                        v-else
                        class="w-56 h-56 flex items-center justify-center rounded-md border border-dashed border-black/10 dark:border-white/10 text-xs text-black/60 dark:text-white/60"
                    >
                        Gerando QR Code...
                    </div>
                    <span class="text-xs text-black/60 dark:text-white/60">
                        Aguardando conexão...
                    </span>
                </div>

                <ElForm v-if="isConnected" label-position="top">
                    <ElFormItem label="Nome da instância">
                        <ElInput v-model="form.instance_name" disabled />
                    </ElFormItem>
                    <ElFormItem label="ID da instância">
                        <ElInput v-model="form.instance_id" disabled />
                    </ElFormItem>
                    <ElFormItem label="Webhook URL">
                        <ElInput v-model="form.webhook_url" disabled />
                    </ElFormItem>
                </ElForm>

                <div
                    v-if="isConnected && infoData"
                    class="rounded-md border border-black/10 dark:border-white/10 p-3"
                >
                    <div class="text-sm font-medium mb-2">Conta conectada</div>
                    <div class="text-xs text-black/60 dark:text-white/60">
                        <div>Nome: {{ infoData.profileName || "-" }}</div>
                        <div>Número: {{ infoData.ownerJid || "-" }}</div>
                        <div>
                            Chats: {{ infoData.chatsCount || 0 }} | Contatos:
                            {{ infoData.contactsCount || 0 }} | Mensagens:
                            {{ infoData.messagesCount || 0 }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ElDialog>
</template>
