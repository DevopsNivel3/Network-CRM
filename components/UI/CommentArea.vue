<script setup lang="ts">
import { CopyDocument, Loading } from "@element-plus/icons-vue";

interface CommentUserData {
    id: number;
    nome: string;
    avatar?: string | null;
}

interface CommentItemData {
    id: number;
    descricao: string;
    usuario: CommentUserData;
    criado: string;
    atualizado: string;
    anexos?: {
        id: number;
        nome: string;
        url: string;
        tipo?: string | null;
        tamanho?: number | null;
    }[];
}

interface CommentAreaProps {
    comments: CommentItemData[];
    isSubmitting?: boolean;
    isLoading?: boolean;
    hasMore?: boolean;
    onSend: (
        content: string,
        anexos: CommentItemData["anexos"],
    ) => Promise<boolean> | boolean;
    onEdit: (
        id: number,
        content: string,
        anexos: CommentItemData["anexos"],
    ) => Promise<boolean> | boolean;
    onDelete: (id: number) => Promise<boolean> | boolean;
    onLoadMore?: () => Promise<void> | void;
}

const props = withDefaults(defineProps<CommentAreaProps>(), {
    comments: () => [],
    isSubmitting: false,
    isLoading: false,
    hasMore: false,
});

const { user } = useAuthSession();
const dayjs = useDayjs();
const commentsMoreLoading = ref(false);
const editorKey = ref(0);

// Função para salvar o comentário
const content = ref<string>("");
const editorRef = ref<any>(null);
const editingEditorRef = ref<any>(null);
const attachments = ref<CommentItemData["anexos"]>([]);
const editingAttachments = ref<CommentItemData["anexos"]>([]);
const attachmentDialogOpen = ref(false);
const selectedAttachment = ref<CommentItemData["anexos"][number] | null>(null);
const canSubmit = computed(() => {
    const hasPending = !!editorRef.value?.hasPendingUploads?.();
    const hasAttachments = !!attachments.value?.length;
    if (hasPending) return true;
    if (hasAttachments) return true;
    return !!content.value && !isEmptyContent(content.value);
});

const stripHtml = (value: string) => {
    if (process.client) {
        const div = document.createElement("div");
        div.innerHTML = value;
        return div.textContent || div.innerText || "";
    }
    return value.replace(/<[^>]*>/g, "");
};

const formatBytes = (value?: number | null) => {
    if (value === null || value === undefined) return "";
    if (value === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
        Math.floor(Math.log(value) / Math.log(1024)),
        units.length - 1,
    );
    const size = value / 1024 ** index;
    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[index]}`;
};
const hasImageTag = (value: string) => value.includes("<img");

const isEmptyContent = (value: string) => {
    const text = stripHtml(value).trim();
    return !text && !hasImageTag(value);
};

const handleSendComment = async () => {
    const hasPending = !!editorRef.value?.hasPendingUploads?.();
    if ((!content.value || isEmptyContent(content.value)) && !hasPending)
        return;
    if (props.isSubmitting) return;

    try {
        const updated = await editorRef.value?.finalizeUploads?.();
        if (updated?.content !== undefined) content.value = updated.content;
        if (updated?.attachments) attachments.value = updated.attachments;
        const isCommented = await props.onSend(
            content.value,
            attachments.value,
        );

        if (isCommented) {
            content.value = "";
            attachments.value = [];
            editorKey.value += 1;
            ElMessage.success({
                message: "Comentário adicionado com sucesso!",
                grouping: true,
                plain: true,
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// Abre o modal de deletar o comentário com confirmação
const openCommentDeleteModalConfirmation = async (id: number) => {
    if (!id) return;

    try {
        ElMessageBox.confirm(
            h(
                "span",
                null,
                `Você excluirá permanentemente o comentário. Deseja continuar?`,
            ),
            "Atenção",
            {
                confirmButtonClass:
                    "!bg-red-400 hover:!bg-red-400/60 !transition-colors !text-white !border-none",
                confirmButtonText: "Sim, deletar!",
                cancelButtonText: "Cancelar",
                type: "warning",
            },
        ).then(async () => {
            const isDeleted = await props.onDelete(id);

            if (isDeleted)
                ElMessage.success({
                    message: "Comentário deletado com sucesso!",
                    grouping: true,
                    plain: true,
                });
        });
    } catch (err) {
        console.error(err);
    }
};

// Comentários ordenados por data de criação
const sortedComentarios = computed(() => {
    if (!props.comments?.length) return [];
    return [...props.comments].sort(
        (a, b) => dayjs(b.criado).valueOf() - dayjs(a.criado).valueOf(),
    );
});

// Variáveis reativas para edição de comentários
const editingCommentId = ref<number | null>(null);
const editingContent = ref<string>("");

// Função para iniciar edição
const startEditComment = (item: any) => {
    editingCommentId.value = item.id;
    editingContent.value = item.descricao;
    editingAttachments.value = item.anexos || [];
};

// Função para cancelar edição
const cancelEditComment = () => {
    editingCommentId.value = null;
    editingContent.value = "";
    editingAttachments.value = [];
    editingEditorRef.value?.discardPendingUploads?.();
};

// Função para salvar edição
const saveEditComment = async (item: any) => {
    const hasPending = !!editingEditorRef.value?.hasPendingUploads?.();
    const hasAttachments = !!editingAttachments.value?.length;
    if (isEmptyContent(editingContent.value) && !hasPending && !hasAttachments)
        return;
    const updated = await editingEditorRef.value?.finalizeUploads?.();
    if (updated?.content !== undefined) editingContent.value = updated.content;
    if (updated?.attachments) editingAttachments.value = updated.attachments;
    const isEdited = await props.onEdit(
        item.id,
        editingContent.value,
        editingAttachments.value,
    );
    if (isEdited) {
        ElMessage.success({
            message: "Comentário editado com sucesso!",
            plain: true,
            grouping: true,
        });
        editingCommentId.value = null;
        editingContent.value = "";
        editingAttachments.value = [];
    }
};

// Função para copiar o comentário
const copyComment = async (text: string) => {
    try {
        await navigator.clipboard.writeText(stripHtml(text));
        ElMessage.success({
            message: "Comentário copiado!",
            plain: true,
            grouping: true,
        });
    } catch {
        ElMessage.error({ message: "Erro ao copiar comentário.", plain: true });
    }
};

const loadMoreComments = async () => {
    if (!props.onLoadMore || commentsMoreLoading.value) return;
    commentsMoreLoading.value = true;
    try {
        await props.onLoadMore();
    } finally {
        commentsMoreLoading.value = false;
    }
};

const shouldShowFromNow = (date: string) => dayjs().diff(date, "day") < 1;

const openAttachmentFromView = (item: CommentItemData["anexos"][number]) => {
    const isPdf =
        item.tipo === "application/pdf" ||
        item.nome.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
        ElMessage.info({
            message: "Baixando arquivo...",
            plain: true,
            grouping: true,
        });
        const link = document.createElement("a");
        link.href = item.url;
        link.download = item.nome;
        link.rel = "noopener";
        link.click();
        setTimeout(() => {
            ElMessage.success({
                message: "Download concluído",
                plain: true,
                grouping: true,
            });
        }, 1200);
        return;
    }
    selectedAttachment.value = item;
    attachmentDialogOpen.value = true;
};
</script>

<template>
    <div class="mt-3">
        <div class="flex w-full">
            <div class="flex flex-col w-full">
                <div class="pt-3">
                    <UIContentEditor
                        ref="editorRef"
                        :key="editorKey"
                        v-model:content="content"
                        v-model:attachments="attachments"
                        content-type="html"
                        :max-length="8192"
                    />
                </div>
                <div class="flex items-center justify-end mt-2">
                    <ElButton
                        :disabled="!canSubmit || isSubmitting"
                        @click="handleSendComment"
                        type="primary"
                        size="small"
                    >
                        Salvar
                    </ElButton>
                </div>
            </div>
        </div>
    </div>
    <div
        class="relative flex flex-col mt-2 gap-2"
        v-infinite-scroll="loadMoreComments"
        :infinite-scroll-disabled="
            !onLoadMore || commentsMoreLoading || isLoading || !hasMore
        "
    >
        <div
            v-for="(item, index) in sortedComentarios"
            class="relative flex gap-3 w-full pt-3 pb-1"
            :key="item.id"
        >
            <div
                v-if="index !== sortedComentarios.length - 1"
                class="absolute left-[20px] top-[32px] bottom-[-40px] w-px bg-black/10 dark:bg-white/10 z-0"
            />
            <div
                class="relative z-10 !min-w-[40px] !max-w-[40px] !min-h-[40px] !max-h-[40px]"
            >
                <div
                    class="absolute inset-0 rounded-full bg-white dark:bg-eerie"
                />
                <ElAvatar
                    class="relative !text-black dark:!text-white !font-semibold !min-w-[40px] !max-w-[40px] !min-h-[40px] !max-h-[40px]"
                    :src="parserAvatar(item.usuario?.avatar)"
                >
                    <span
                        v-if="item.usuario?.nome"
                        class="font-medium uppercase !text-xs"
                    >
                        {{ item.usuario?.nome.slice(0, 1) }}
                    </span>
                </ElAvatar>
            </div>
            <div class="flex flex-col w-full gap-1">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-1">
                        <h3 class="font-medium truncate">
                            {{ item.usuario?.nome }}
                        </h3>
                        <span
                            v-if="
                                item.atualizado &&
                                $dayjs(item.atualizado).valueOf() !==
                                    $dayjs(item.criado).valueOf()
                            "
                            class="text-[10px] opacity-60 font-semibold"
                        >
                            (Editado)
                        </span>
                    </div>
                    <span class="flex items-center text-xs opacity-80">
                        {{
                            $dayjs(item.criado).format(
                                "DD[/]MM[/]YYYY, [às] HH:mm",
                            )
                        }}
                        <span
                            v-if="shouldShowFromNow(item.criado)"
                            class="ml-2 text-gray-400 hidden md:block"
                        >
                            ({{ $dayjs(item.criado).fromNow() }})
                        </span>
                    </span>
                </div>
                <UIContentEditor
                    v-if="editingCommentId === item.id"
                    ref="editingEditorRef"
                    v-model:content="editingContent"
                    v-model:attachments="editingAttachments"
                    content-type="html"
                    :max-length="8192"
                    :active="true"
                />
                <div v-else>
                    <div
                        v-if="!isEmptyContent(item.descricao)"
                        class="relative group"
                    >
                        <div
                            class="ql-editor !min-h-[52px] !rounded-lg border"
                            :style="{
                                borderColor: 'var(--el-border-color)',
                                backgroundColor: 'var(--el-fill-color-blank)',
                            }"
                        >
                            <div class="comment-html" v-html="item.descricao" />
                        </div>
                        <ElButton
                            class="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity !p-1 !h-7 !w-7"
                            @click="copyComment(item.descricao)"
                            :icon="CopyDocument"
                            text
                            circle
                        />
                    </div>
                    <div
                        v-if="item.anexos?.length"
                        class="mt-2 grid grid-cols-2 gap-2"
                    >
                        <button
                            v-for="anexo in item.anexos"
                            :key="anexo.id"
                            type="button"
                            class="text-left text-xs truncate rounded-md border px-2.5 py-1.5 min-h-[32px] flex items-center justify-between gap-2 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/20 dark:hover:border-white/20 transition-colors"
                            :style="{
                                borderColor: 'var(--el-border-color)',
                                backgroundColor: 'var(--el-fill-color-blank)',
                            }"
                            @click="openAttachmentFromView(anexo)"
                        >
                            <span class="font-medium truncate">
                                {{ anexo.nome }}
                            </span>
                            <span
                                v-if="anexo.tamanho"
                                class="ml-1 text-[10px] text-gray-500"
                            >
                                ({{ formatBytes(anexo.tamanho) }})
                            </span>
                        </button>
                    </div>
                </div>
                <div
                    class="flex items-center gap-1"
                    v-if="item.usuario.id === user.id"
                >
                    <template v-if="editingCommentId === item.id">
                        <ElButton
                            @click="saveEditComment(item)"
                            class="!text-xs"
                            type="primary"
                            size="small"
                            link
                        >
                            Salvar
                        </ElButton>
                        <span>•</span>
                        <ElButton
                            @click="cancelEditComment"
                            class="!text-xs"
                            type="danger"
                            size="small"
                            link
                        >
                            Cancelar
                        </ElButton>
                    </template>
                    <template v-else>
                        <ElButton
                            @click="startEditComment(item)"
                            class="!text-xs"
                            type="primary"
                            size="small"
                            link
                        >
                            Editar
                        </ElButton>
                        <span>•</span>
                        <ElButton
                            @click="openCommentDeleteModalConfirmation(item.id)"
                            class="!text-xs"
                            type="danger"
                            size="small"
                            link
                        >
                            Deletar
                        </ElButton>
                    </template>
                </div>
            </div>
        </div>
        <div
            v-if="isLoading || commentsMoreLoading"
            class="flex items-center justify-center py-3"
        >
            <ElIcon
                class="is-loading"
                color="var(--el-color-primary)"
                size="18"
            >
                <Loading />
            </ElIcon>
        </div>
    </div>
    <ElDialog
        v-model="attachmentDialogOpen"
        width="90vw"
        style="max-width: 900px"
        :show-close="false"
        @closed="selectedAttachment = null"
    >
        <template #header>
            <UIDialogHeader
                :title="selectedAttachment?.nome || 'Anexo'"
                @close="attachmentDialogOpen = false"
            />
        </template>
        <div v-if="selectedAttachment" class="space-y-3">
            <div
                class="border rounded-md overflow-hidden"
                :style="{ borderColor: 'var(--el-border-color)' }"
            >
                <embed
                    :src="selectedAttachment.url"
                    type="application/pdf"
                    class="w-full h-[60vh] block"
                />
            </div>
        </div>
    </ElDialog>
</template>

<style scoped>
.comment-html :deep(a) {
    color: #79fe96;
    text-decoration: underline;
}

.comment-html :deep([data-attachments="true"]) {
    margin-top: 8px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}

.comment-html :deep([data-attachments="true"] p) {
    margin: 0;
}

.comment-html :deep([data-attachments="true"] a) {
    display: block;
    padding: 6px 8px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background-color: var(--el-fill-color-blank);
    font-size: 12px;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
