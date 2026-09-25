<template>
    <span class="inline-flex items-center gap-2">
        <button
            type="button"
            class="underline transition-opacity hover:opacity-70"
            @click.prevent="openChat"
            :disabled="!props.phone || isLoading"
        >
            {{ displayPhone || "—" }}
        </button>
        <ElTooltip content="Abrir WhatsApp" placement="top">
            <ElButton
                :icon="ChatLineRound"
                size="small"
                :disabled="!props.phone || isLoading"
                @click="openChat"
                circle
            />
        </ElTooltip>
    </span>

    <ElDialog
        v-model="isOpen"
        destroy-on-close
        :show-close="false"
        class="wa-dialog !w-full md:!w-[900px]"
        :z-index="1500"
        align-center
    >
        <template #header>
            <UIDialogHeader title="Chat WhatsApp" @close="isOpen = false" />
        </template>

        <div class="!h-[calc(100vh-200px)] relative !min-h-[520px] flex">
            <div class="flex flex-col flex-1 h-full">
                <div
                    v-if="isLoading"
                    class="absolute inset-0 flex items-center justify-center"
                >
                    <ElIcon
                        class="is-loading"
                        color="var(--el-color-primary)"
                        size="25"
                    >
                        <Loading />
                    </ElIcon>
                </div>
                <div v-else class="flex flex-col h-full">
                    <ElAlert
                        v-if="!hasWhatsapp"
                        title="Número sem WhatsApp"
                        type="warning"
                        :closable="false"
                        show-icon
                    />

                    <div
                        ref="messagesRef"
                        class="flex-1 mt-4 px-4 pb-4 flex flex-col gap-3 overflow-auto"
                    >
                        <div
                            v-for="(msg, index) in messages"
                            :key="msg.id || msg.message_id"
                            class="flex items-start gap-2"
                            :class="
                                msg.direction === 'out'
                                    ? 'justify-end'
                                    : 'justify-start'
                            "
                        >
                            <ElAvatar
                                v-if="
                                    msg.direction !== 'out' &&
                                    shouldShowMeta(index)
                                "
                                :src="contact?.foto_url"
                                size="small"
                            >
                                <span v-if="contactDisplayName">
                                    {{ contactDisplayName.slice(0, 1) }}
                                </span>
                                <ElIcon v-else><User /></ElIcon>
                            </ElAvatar>
                            <div class="flex flex-col gap-1">
                                <div
                                    v-if="shouldShowMeta(index)"
                                    class="flex items-center justify-between gap-3 text-xs text-black/60 dark:text-white/60"
                                >
                                    <span>
                                        {{
                                            msg.direction === "out"
                                                ? msg.usuario?.nome || "Usuário"
                                                : contactDisplayName
                                        }}
                                    </span>
                                    <span>
                                        {{
                                            msg.criado
                                                ? $dayjs(msg.criado).format(
                                                      "DD/MM/YYYY HH:mm",
                                                  )
                                                : msg.timestamp
                                                  ? $dayjs(
                                                        msg.timestamp,
                                                    ).format("DD/MM/YYYY HH:mm")
                                                  : "—"
                                        }}
                                    </span>
                                </div>
                                <div
                                    class="max-w-[70%] rounded px-3 py-2 text-sm space-y-2 !text-white"
                                    :class="
                                        msg.direction === 'out'
                                            ? 'bg-nivel'
                                            : 'bg-black/60 dark:bg-white/20'
                                    "
                                >
                                    <template v-if="msg.media_base64">
                                        <img
                                            v-if="msg.media_type === 'image'"
                                            :src="`data:${msg.media_mime};base64,${msg.media_base64}`"
                                            class="max-w-full rounded"
                                        />
                                        <video
                                            v-else-if="
                                                msg.media_type === 'video'
                                            "
                                            :src="`data:${msg.media_mime};base64,${msg.media_base64}`"
                                            controls
                                            class="max-w-full rounded"
                                        />
                                        <audio
                                            v-else-if="
                                                msg.media_type === 'audio'
                                            "
                                            :src="`data:${msg.media_mime};base64,${msg.media_base64}`"
                                            controls
                                        />
                                        <a
                                            v-else
                                            :href="`data:${msg.media_mime};base64,${msg.media_base64}`"
                                            class="underline"
                                            :download="
                                                msg.media_name || 'arquivo'
                                            "
                                        >
                                            {{ msg.media_name || "Arquivo" }}
                                        </a>
                                    </template>
                                    <div
                                        v-if="msg.body"
                                        class="whitespace-pre-wrap"
                                    >
                                        {{ msg.body }}
                                    </div>
                                </div>
                            </div>
                            <ElAvatar
                                v-if="
                                    msg.direction === 'out' &&
                                    shouldShowMeta(index)
                                "
                                :src="msg.usuario?.avatar"
                                size="small"
                            >
                                <span v-if="msg.usuario?.nome">
                                    {{ msg.usuario.nome.slice(0, 1) }}
                                </span>
                            </ElAvatar>
                        </div>
                    </div>

                    <div class="px-4 pb-4 border-t dark:border-white/10">
                        <div class="mt-3 flex flex-wrap gap-2">
                            <ElTag
                                v-for="template in templates"
                                :key="template.id"
                                effect="dark"
                                class="cursor-pointer"
                                @click="handleTemplateClick(template)"
                            >
                                {{ template.titulo }}
                            </ElTag>
                        </div>

                        <div class="mt-3 flex items-center gap-2">
                            <ElInput
                                v-model="messageText"
                                type="textarea"
                                :rows="3"
                                placeholder="Digite sua mensagem"
                            />
                            <ElButton
                                type="primary"
                                :icon="Phone"
                                @click="handleSend"
                            >
                                Enviar
                            </ElButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ElDialog>
</template>

<script setup lang="ts">
import { ChatLineRound, User, Phone } from "@element-plus/icons-vue";

const props = defineProps<{
    phone?: string | null;
    leadId?: number | null;
    contactName?: string | null;
}>();

const isOpen = ref(false);
const isLoading = ref(false);
const hasWhatsapp = ref(false);
const contact = ref<any>(null);
const messages = ref<any[]>([]);
const templates = ref<any[]>([]);
const messageText = ref("");
const streamSource = ref<EventSource | null>(null);
const { token } = useAuth();
const chatNumber = ref<string | null>(null);
const reconnectTimer = ref<number | null>(null);
const messagesRef = ref<HTMLElement | null>(null);
const { $dayjs } = useNuxtApp();

const displayPhone = computed(() =>
    props.phone ? formatPhone(String(props.phone)) : "",
);

const contactDisplayName = computed(() => {
    if (contact.value?.nome) return contact.value.nome;
    if (props.contactName) return props.contactName;
    return "Contato";
});

const getMessageTime = (msg: any) => msg?.criado || msg?.timestamp || null;

const shouldShowMeta = (index: number) => {
    const msg = messages.value[index];
    const prev = messages.value[index - 1];
    if (!msg || !prev) return true;
    if (msg.direction !== prev.direction) return true;

    const currentTime = getMessageTime(msg);
    const prevTime = getMessageTime(prev);
    if (!currentTime || !prevTime) return true;

    return !$dayjs(currentTime).isSame($dayjs(prevTime), "minute");
};

const openChat = async () => {
    if (!props.phone) return;
    isLoading.value = true;
    try {
        const res = await useApi<any>("/api/whatsapp/check", {
            method: "POST",
            body: {
                phone: props.phone,
                lead_id: props.leadId || undefined,
                contact_name: props.contactName || undefined,
            },
        });
        hasWhatsapp.value = !!res?.exists;
        contact.value = res?.contact || null;
        messages.value = Array.isArray(res?.messages) ? res.messages : [];
        templates.value = res?.templates || [];
        chatNumber.value = res?.numero || props.phone || null;
        isOpen.value = true;
        tryOpenStream();
    } catch (err: any) {
        ElMessage.error({
            message: err?.data?.message || "Erro ao verificar WhatsApp",
            plain: true,
        });
    } finally {
        isLoading.value = false;
    }
};

const clearReconnect = () => {
    if (reconnectTimer.value) {
        clearTimeout(reconnectTimer.value);
        reconnectTimer.value = null;
    }
};

const openStream = () => {
    const numero = chatNumber.value || props.phone;
    if (!numero || !token.value) return;
    closeStream();
    const url = `/api/whatsapp/stream?numero=${encodeURIComponent(
        String(numero),
    )}&token=${encodeURIComponent(token.value || "")}`;
    const source = new EventSource(url);
    source.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload?.type !== "message") return;
            const msg = payload.message;
            if (!msg) return;
            const exists = messages.value.some((item) => {
                if (item.message_id && msg.message_id)
                    return item.message_id === msg.message_id;
                if (item.id && msg.id) return item.id === msg.id;
                const sameDirection = item.direction === msg.direction;
                const sameBody =
                    item.body && msg.body && item.body === msg.body;
                const timeA = item.criado || item.timestamp;
                const timeB = msg.criado || msg.timestamp;
                if (!sameDirection || !sameBody || !timeA || !timeB)
                    return false;
                return $dayjs(timeA).isSame($dayjs(timeB), "minute");
            });
            if (!exists) messages.value.push(msg);
        } catch (err) {
            console.error(err);
        }
    };
    source.onerror = () => {
        closeStream();
        scheduleReconnect();
    };
    streamSource.value = source;
};

const closeStream = () => {
    if (streamSource.value) {
        streamSource.value.close();
        streamSource.value = null;
    }
    clearReconnect();
};

const scheduleReconnect = () => {
    clearReconnect();
    if (!isOpen.value) return;
    reconnectTimer.value = window.setTimeout(() => {
        openStream();
    }, 2000);
};

const tryOpenStream = () => {
    if (!isOpen.value) return;
    if (!token.value) return;
    openStream();
};

const handleSend = async () => {
    if (!messageText.value.trim() || !props.phone) return;
    const text = messageText.value.trim();
    messageText.value = "";
    try {
        await useApi<any>("/api/whatsapp/send", {
            method: "POST",
            body: {
                phone: props.phone,
                lead_id: props.leadId || undefined,
                text,
            },
        });
    } catch (err: any) {
        ElMessage.error({
            message: err?.data?.message || "Erro ao enviar mensagem",
            plain: true,
        });
    }
};

const handleTemplateClick = (template: any) => {
    messageText.value = template.corpo || "";
};

const scrollToBottom = async () => {
    await nextTick();
    if (messagesRef.value)
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
};

watch(
    () => isOpen.value,
    (open) => {
        if (!open) {
            closeStream();
            return;
        }
        tryOpenStream();
        scrollToBottom();
    },
);

watch(
    () => token.value,
    () => tryOpenStream(),
);

watch(
    () => chatNumber.value,
    () => tryOpenStream(),
);

watch(
    () => messages.value.length,
    () => scrollToBottom(),
);

onUnmounted(() => closeStream());
</script>

<style scoped>
</style>
