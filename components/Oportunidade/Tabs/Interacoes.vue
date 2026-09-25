<script setup lang="ts">
import {
    Message,
    Plus,
    Close,
    Check,
    MoreFilled,
    ChatLineRound,
    Phone,
    Promotion,
} from "@element-plus/icons-vue";
import { CopyDocument, Edit, Delete } from "@element-plus/icons-vue";

const oportunidade = useOportunidade();
const dayjs = useDayjs();
const { user } = useAuthSession();
const isAdmin = computed(() =>
    hasUserPermission(user.permissoes, UserPermissions.ADMIN),
);
const isPrincipal = computed(
    () => !!oportunidade.data?.responsavel_atual?.principal,
);

const attachmentDialogOpen = ref(false);
const selectedAttachment = ref<any>(null);

const canManageInteracao = (interacao: any) => {
    if (isAdmin.value || isPrincipal.value) return true;
    return interacao?.usuario?.id === user.id;
};

const stripHtml = (value: string) => {
    if (!value) return "";
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .trim();
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

// Ordena as interações por data
const sortedInteracoes = computed(() => {
    if (!oportunidade.interacoes.data!.data) return [];
    return [...oportunidade.interacoes.data!.data].sort(
        (a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf(),
    );
});

// Estado dinâmico
const formModel = computed(() => {
    return editingInteracaoId.value ? editingInteracaoData : newInteracaoData;
});

const editorRef = ref<any>(null);

const resolveEditorUploads = async () => {
    const editor = editorRef.value;
    if (!editor?.finalizeUploads) return;
    const updated = await editor.finalizeUploads();
    if (updated?.content !== undefined)
        formModel.value.conteudo = updated.content;
    if (updated?.attachments) formModel.value.anexos = updated.attachments;
};

// Estado de edição da interação
const editingInteracaoId = ref<number | null>(null);
const editingInteracaoData = reactive<{
    tipo: TipoOportunidadeInteracao;
    conteudo: string;
    data: Date;
    status: StatusOportunidadeInteracao | 1;
    anexos: any[];
}>({
    tipo: 1,
    conteudo: "",
    data: new Date(),
    status: 1,
    anexos: [],
});

// Estado de criação da interação
const creatingNewInteracao = ref(false);
const newInteracaoData = reactive<{
    tipo: TipoOportunidadeInteracao;
    conteudo: string;
    data: Date;
    status: StatusOportunidadeInteracao | 1;
    anexos: any[];
}>({
    tipo: 1,
    conteudo: "",
    data: new Date(),
    status: 1,
    anexos: [],
});

// Iniciar a edição da interação
function startEditInteracao(item: any) {
    editingInteracaoId.value = item.id;
    editingInteracaoData.conteudo = item.conteudo;
    editingInteracaoData.tipo = item.tipo;
    editingInteracaoData.data = new Date(item.data);
    editingInteracaoData.status = item.status;
    editingInteracaoData.anexos = item.anexos || [];
}

// Cancelar a edição da interação
function cancelEditInteracao() {
    editingInteracaoId.value = null;
    editorRef.value?.discardPendingUploads?.();
}

// Salvar a edição de uma interação
async function saveEditInteracao(item: any) {
    await resolveEditorUploads();
    const oportunidadeId = oportunidade.data!.id;
    const isEdited = await oportunidade.editInteracao(
        oportunidadeId,
        item.id,
        editingInteracaoData,
    );

    if (isEdited) {
        ElMessage.success({
            message: "Interação editada com sucesso!",
            plain: true,
            grouping: true,
        });
        cancelEditInteracao();
    }
}

// Abre um modal de confirmação para deletar uma interação
async function deleteInteracao(item: any) {
    ElMessageBox.confirm(
        "Você excluirá permanentemente a interação. Deseja continuar?",
        "Atenção",
        {
            confirmButtonClass:
                "!bg-red-400 hover:!bg-red-400/60 !text-white !border-none",
            confirmButtonText: "Sim, deletar!",
            cancelButtonText: "Cancelar",
            type: "warning",
        },
    ).then(async () => {
        const oportunidadeId = oportunidade.data!.id;
        const isDeleted = await oportunidade.deleteInteracao(
            oportunidadeId,
            item.id,
        );

        if (isDeleted)
            ElMessage.success({
                message: "Interação deletada com sucesso!",
                grouping: true,
                plain: true,
            });
    });
}

// Copia o conteúdo da interação
const copyComment = async (text: string) => {
    try {
        await navigator.clipboard.writeText(stripHtml(text));
        ElMessage.success({
            message: "Conteúdo copiado!",
            grouping: true,
            plain: true,
        });
    } catch {
        ElMessage.error({ message: "Erro ao copiar conteúdo.", plain: true });
    }
};

const openAttachmentFromView = (item: any) => {
    const isPdf =
        item?.tipo === "application/pdf" ||
        (item?.nome || "").toLowerCase().endsWith(".pdf");
    if (!isPdf) {
        ElMessage.info({
            message: "Baixando arquivo...",
            plain: true,
            grouping: true,
        });
        const link = document.createElement("a");
        link.href = item.url;
        link.download = item.nome || "arquivo";
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

// Iniciar a criação da interação
function startCreateInteracao() {
    creatingNewInteracao.value = true;
    newInteracaoData.tipo = 1;
    newInteracaoData.conteudo = "";
    newInteracaoData.data = new Date();
    newInteracaoData.status = 1;
    newInteracaoData.anexos = [];
}

// Cancelar a criação da interação
function cancelCreateInteracao() {
    creatingNewInteracao.value = false;
    editorRef.value?.discardPendingUploads?.();
}

// Salvar uma nova interação
async function saveNewInteracao() {
    await resolveEditorUploads();
    const oportunidadeId = oportunidade.data!.id;
    const isCreated = await oportunidade.createInteracao(
        oportunidadeId,
        newInteracaoData,
    );

    if (isCreated) {
        ElMessage.success({
            message: "Interação adicionada com sucesso!",
            grouping: true,
            plain: true,
        });
        cancelCreateInteracao();
    }
}

// Icones para os tipos de interação
const tipoIcones: Record<number, Component> = {
    1: ChatLineRound,
    2: Promotion,
    3: Phone,
};

// Muda os status ao alterar o tipo no select
watch(
    () => formModel.value.tipo,
    (novoTipo) => {
        formModel.value.status =
            oportunidade.statusInteracaoOptions[novoTipo]?.[0].value || 1;
    },
);

// Carregamento automático das interações
const interacoesMoreLoading = ref<boolean>(false);
const loadMoreInteracoes = async () => {
    if (oportunidade.interacoes.isLoading || interacoesMoreLoading.value)
        return;
    interacoesMoreLoading.value = true;

    try {
        const oportunidadeId = oportunidade.data?.id;
        if (!oportunidadeId) return;

        await oportunidade.loadMoreInteracoes(oportunidadeId);
    } finally {
        interacoesMoreLoading.value = false;
    }
};
</script>

<template>
    <ElScrollbar class="!relative !h-full !w-full">
        <div class="p-4">
            <div
                v-if="
                    !oportunidade.interacoes.isLoading &&
                    oportunidade.interacoes.data?.data &&
                    oportunidade.interacoes.data?.data?.length > 0 &&
                    !creatingNewInteracao &&
                    !editingInteracaoId
                "
                class="h-96 md:h-full w-full flex flex-col gap-4"
            >
                <div
                    v-if="!creatingNewInteracao && !editingInteracaoId"
                    class="absolute right-0 left-0 px-4 top-0 z-10 flex items-center justify-between bg-[var(--el-bg-color)] py-3"
                >
                    <h1
                        class="flex items-center gap-2 font-semibold tracking-wider uppercase"
                    >
                        Interações
                    </h1>
                    <ElButton
                        v-if="
                            !creatingNewInteracao &&
                            !editingInteracaoId &&
                            oportunidade.interacoes?.data.data!.length > 0
                        "
                        @click="startCreateInteracao"
                        type="primary"
                        :icon="Plus"
                        size="small"
                    >
                        Adicionar
                    </ElButton>
                </div>
                <div
                    v-if="sortedInteracoes.length > 0"
                    v-infinite-scroll="loadMoreInteracoes"
                    :infinite-scroll-disabled="
                        interacoesMoreLoading || !oportunidade.hasMoreInteracoes
                    "
                    class="flex flex-col gap-4 mt-8"
                >
                    <div
                        v-for="interacao in sortedInteracoes"
                        :key="interacao.id"
                        class="bg-white dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-lg p-4"
                    >
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center gap-3">
                                <ElAvatar
                                    :src="
                                        parserAvatar(interacao.usuario?.avatar)
                                    "
                                    size="small"
                                    class="!text-black dark:!text-white !font-semibold"
                                >
                                    <span
                                        v-if="interacao.usuario?.nome"
                                        class="uppercase text-xs"
                                    >
                                        {{
                                            interacao.usuario?.nome.slice(0, 1)
                                        }}
                                    </span>
                                </ElAvatar>
                                <div class="flex flex-col">
                                    <span
                                        class="text-sm text-gray-800 truncate max-w-52 dark:text-gray-100"
                                    >
                                        {{ interacao.usuario?.nome }}
                                    </span>
                                    <span
                                        class="text-xs text-gray-500 dark:text-gray-400"
                                    >
                                        {{
                                            $dayjs(interacao.data).format(
                                                "DD/MM/YYYY, [às] HH:mm",
                                            )
                                        }}
                                    </span>
                                </div>
                            </div>
                            <ElDropdown
                                v-if="canManageInteracao(interacao)"
                                trigger="click"
                            >
                                <ElButton
                                    text
                                    :icon="MoreFilled"
                                    class="!text-gray-500 dark:!text-gray-400"
                                />
                                <template #dropdown>
                                    <ElDropdownMenu>
                                        <ElDropdownItem
                                            @click="
                                                startEditInteracao(interacao)
                                            "
                                            :icon="Edit"
                                        >
                                            Editar
                                        </ElDropdownItem>
                                        <ElDropdownItem
                                            @click="deleteInteracao(interacao)"
                                            :icon="Delete"
                                            class="!text-red-500"
                                        >
                                            Excluir
                                        </ElDropdownItem>
                                    </ElDropdownMenu>
                                </template>
                            </ElDropdown>
                        </div>
                        <div class="space-y-3">
                            <div class="flex items-center gap-2">
                                <ElTag
                                    size="small"
                                    effect="plain"
                                    class="!font-medium"
                                    disable-transitions
                                >
                                    <ElIcon class="mr-1">
                                        <component
                                            :is="tipoIcones[interacao.tipo]"
                                        />
                                    </ElIcon>
                                    {{
                                        oportunidade.getTipoInteracao[
                                            interacao.tipo
                                        ]
                                    }}
                                </ElTag>
                                <ElTag
                                    type="info"
                                    size="small"
                                    effect="plain"
                                    class="!font-medium"
                                    disable-transitions
                                >
                                    {{
                                        oportunidade.getStatusInteracao[
                                            interacao.status
                                        ]
                                    }}
                                </ElTag>
                            </div>
                            <template v-if="interacao.conteudo">
                                <div class="relative group">
                                    <div
                                        class="ql-editor interacao-html !min-h-[52px] !rounded-lg border text-sm text-gray-700 dark:text-gray-300"
                                        :style="{
                                            borderColor:
                                                'var(--el-border-color)',
                                            backgroundColor:
                                                'var(--el-fill-color-blank)',
                                        }"
                                    >
                                        <div v-html="interacao.conteudo" />
                                    </div>
                                    <ElButton
                                        class="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        @click="copyComment(interacao.conteudo)"
                                        :icon="CopyDocument"
                                        text
                                        circle
                                    />
                                </div>
                            </template>
                            <div
                                v-if="interacao.anexos?.length"
                                class="mt-2 grid grid-cols-2 gap-2"
                            >
                                <button
                                    v-for="anexo in interacao.anexos"
                                    :key="anexo.id"
                                    type="button"
                                    class="text-left text-xs truncate rounded-md border px-2.5 py-1.5 min-h-[32px] flex items-center justify-between gap-2 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/20 dark:hover:border-white/20 transition-colors"
                                    :style="{
                                        borderColor: 'var(--el-border-color)',
                                        backgroundColor:
                                            'var(--el-fill-color-blank)',
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
                    </div>
                </div>
            </div>
            <!-- Caso não tenha interações -->
            <div
                v-else-if="
                    !oportunidade.interacoes.isLoading &&
                    oportunidade.interacoes.data?.data?.length === 0 &&
                    !creatingNewInteracao &&
                    !editingInteracaoId
                "
                class="h-96 md:h-full md:absolute inset-0 bg-black/5 dark:bg-white/5 flex flex-col gap-2 items-center justify-center"
            >
                No momento não há interações.
                <ElButton
                    @click="startCreateInteracao"
                    type="primary"
                    :icon="Plus"
                    size="small"
                >
                    Adicionar
                </ElButton>
            </div>
            <!-- Tela de Carregamento -->
            <UILoadingOverlay v-if="oportunidade.interacoes.isLoading" />
            <!-- Criação e Edição de Interação -->
            <template
                v-if="
                    (creatingNewInteracao || editingInteracaoId) &&
                    !oportunidade.interacoes.isLoading
                "
            >
                <div
                    class="md:absolute inset-0 flex items-center justify-center p-4"
                >
                    <div
                        class="w-full h-full md:h-full md:max-w-[720px] border border-black/5 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 flex flex-col min-h-0"
                    >
                        <div class="px-4 pt-3 pb-2">
                            <h2 class="flex items-center gap-2 font-semibold">
                                <ElIcon
                                    ><component
                                        :is="editingInteracaoId ? Edit : Plus"
                                /></ElIcon>
                                {{
                                    editingInteracaoId
                                        ? "Editando Interação"
                                        : "Adicionar Interação"
                                }}
                            </h2>
                        </div>
                        <ElScrollbar
                            class="!w-full flex-1 interacoes-scroll min-h-0"
                        >
                            <div class="p-4 pt-3 space-y-4">
                                <div class="space-y-3">
                                    <div class="flex items-center gap-3">
                                        <ElSelect
                                            v-model="formModel.tipo"
                                            placeholder="Tipo"
                                            class="!w-1/2"
                                        >
                                            <ElOption
                                                v-for="tipo in oportunidade.tipoInteracaoOptions"
                                                :label="tipo.label"
                                                :key="tipo.value"
                                                :value="tipo.value"
                                            />
                                        </ElSelect>
                                        <ElSelect
                                            v-model="formModel.status"
                                            placeholder="Status"
                                            :disabled="!formModel.tipo"
                                            class="!w-1/2"
                                        >
                                            <ElOption
                                                v-for="status in oportunidade
                                                    .statusInteracaoOptions[
                                                    formModel.tipo
                                                ] || []"
                                                :key="status.value"
                                                :label="status.label"
                                                :value="status.value"
                                            />
                                        </ElSelect>
                                    </div>
                                    <UIContentEditor
                                        ref="editorRef"
                                        v-model:content="formModel.conteudo"
                                        v-model:attachments="formModel.anexos"
                                        content-type="html"
                                        :max-length="4096"
                                        placeholder="Digite o conteúdo da interação..."
                                        :enable-images="true"
                                    />
                                    <div
                                        class="text-xs text-gray-500 flex items-center gap-2"
                                    >
                                        Data da interação:
                                        <ElDatePicker
                                            v-model="formModel.data"
                                            format="DD/MM/YYYY HH:mm"
                                            :clearable="false"
                                            type="datetime"
                                        />
                                    </div>
                                </div>
                            </div>
                        </ElScrollbar>

                        <div class="flex justify-end px-4 pb-3 pt-2">
                            <ElButton
                                @click="
                                    editingInteracaoId
                                        ? cancelEditInteracao()
                                        : cancelCreateInteracao()
                                "
                                :icon="Close"
                                size="small"
                            >
                                Cancelar
                            </ElButton>
                            <ElButton
                                @click="
                                    editingInteracaoId
                                        ? saveEditInteracao({
                                              id: editingInteracaoId,
                                              ...editingInteracaoData,
                                          })
                                        : saveNewInteracao()
                                "
                                type="primary"
                                :icon="Check"
                                size="small"
                            >
                                Salvar
                            </ElButton>
                        </div>
                    </div>
                </div>
            </template>
            <!-- Tela de Carregamento de mais interações do scroll -->
            <UILoadingOverlay
                v-if="interacoesMoreLoading"
                :size="20"
                container-class="absolute bottom-0 left-0 right-0 flex items-center justify-center"
            />
        </div>
    </ElScrollbar>
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
.interacao-html :deep(a) {
    color: #79fe96;
    text-decoration: underline;
}

.interacao-html {
    white-space: pre-wrap;
    word-break: break-word;
}

.interacao-html :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
}

.interacao-html :deep([data-attachments="true"]) {
    margin-top: 8px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}

.interacao-html :deep([data-attachments="true"] p) {
    margin: 0;
}

.interacao-html :deep([data-attachments="true"] a) {
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

.interacoes-scroll :deep(.el-scrollbar__wrap) {
    overflow-y: auto !important;
    overflow-x: visible !important;
}

.interacoes-scroll :deep(.el-scrollbar__view) {
    overflow: visible !important;
}
</style>
