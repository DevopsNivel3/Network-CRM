<script setup lang="ts">
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import { QuillEditor } from "@vueup/vue-quill";
import { Delete } from "@element-plus/icons-vue";
import type {
  EditorAttachment as AttachmentItem,
  PendingEditorFile as PendingFile,
} from "~/utils/contentEditor";

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Escreva uma observação...",
  },
  contentType: {
    type: String,
    default: "text",
  },
  maxLength: {
    type: Number,
    default: 4096,
  },
  enableImages: {
    type: Boolean,
    default: true,
  },
  enableFiles: {
    type: Boolean,
    default: true,
  },
  toolbar: {
    type: [String, Array, Object, Boolean],
    default: null,
  },
  showToolbarOnFocus: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  attachments: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits<{
  "update:content": [value: string];
  "update:attachments": [value: AttachmentItem[]];
}>();

const quillInstance = ref<any>(null);

const getContentLength = (value: string) => {
  return getEditorContentLength(value, props.contentType);
};

const lastValidContent = ref(props.content);

watch(
  () => props.content,
  (value) => {
    if (typeof value === "string") lastValidContent.value = value;
  },
);

const emitContent = (value: string) => {
  if (props.contentType === "html") {
    if (getContentLength(value) <= props.maxLength) {
      lastValidContent.value = value;
      emit("update:content", value);
    } else {
      emit("update:content", lastValidContent.value || "");
    }
    return;
  }

  if (value.length <= props.maxLength) emit("update:content", value);
  else emit("update:content", value.substring(0, props.maxLength));
};

const textContent = computed({
  get: () => props.content,
  set: (value: string) => {
    emitContent(value);
  },
});

const displayLength = computed(() => {
  if (props.contentType !== "html") {
    return textContent.value.length === 1 ? 0 : textContent.value.length;
  }

  return getContentLength(textContent.value);
});

const isHtml = computed(() => props.contentType === "html");
const resolvedTheme = computed(() => (isHtml.value ? "snow" : ""));
const resolvedToolbar = computed(() => {
  if (!isHtml.value) return undefined;
  if (props.toolbar !== null) {
    if (Array.isArray(props.toolbar)) {
      const clone = props.toolbar.map((row) =>
        Array.isArray(row) ? [...row] : row,
      ) as any[];
      const lastRow = clone.findLast((row) => Array.isArray(row)) as
        any[] | undefined;
      const targetRow = lastRow || [];
      const ensureButton = (btn: string) => {
        if (!targetRow.includes(btn)) targetRow.push(btn);
      };
      if (props.enableImages) ensureButton("image");
      if (!lastRow) clone.push(targetRow);
      return clone;
    }
    return props.toolbar;
  }

  const base = [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
  ];

  if (props.enableImages) base[2].push("image" as any);
  return base;
});

const isFocused = ref(false);
const isActive = computed(() => props.active || isFocused.value);

const pendingFiles = ref<Map<string, PendingFile>>(new Map());

const attachments = ref<AttachmentItem[]>(
  (props.attachments as AttachmentItem[]) || [],
);
const attachmentDialogOpen = ref(false);
const selectedAttachment = ref<AttachmentItem | null>(null);

watch(
  () => props.attachments,
  (value) => {
    const items = ((value as AttachmentItem[]) || []).map((item: any) => ({
      id: item.id ?? item.url ?? String(Math.random()),
      name: item.name ?? item.nome ?? "arquivo",
      url: item.url,
      type: item.type ?? item.tipo,
      size: item.size ?? item.tamanho,
    }));
    attachments.value = items;
  },
  { immediate: true },
);

const pendingAttachmentList = computed<AttachmentItem[]>(() =>
  Array.from(pendingFiles.value.entries()).map(([id, item]) => ({
    id,
    name: item.name,
    url: item.url,
    type: item.type,
    size: item.file.size,
    pending: true,
  })),
);

const attachmentList = computed(() => [
  ...attachments.value,
  ...pendingAttachmentList.value,
]);

const openAttachment = (item: AttachmentItem) => {
  const isPdf =
    item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    ElMessage.info({
      message: "Baixando arquivo...",
      plain: true,
      grouping: true,
    });
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name;
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

const removeAttachment = (item: AttachmentItem) => {
  if (item.pending) {
    const pendingId = String(item.id);
    const pending = pendingFiles.value.get(pendingId);
    if (pending) URL.revokeObjectURL(pending.url);
    pendingFiles.value.delete(pendingId);
    return;
  }
  const next = attachments.value.filter((att) => att.id !== item.id);
  attachments.value = next;
  emit("update:attachments", next);
};

const createToken = () => {
  if (process.client && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const registerPendingFile = (file: File) => {
  const token = createToken();
  const url = URL.createObjectURL(file);
  pendingFiles.value.set(token, {
    file,
    url,
    name: file.name || "arquivo",
    type: file.type || "application/octet-stream",
  });
  return { token, url };
};

const uploadFile = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return await useApi<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>("/api/files", {
    method: "POST",
    body: form,
  });
};

const insertPendingFile = (file: File) => {
  registerPendingFile(file);
};

const discardPendingUploads = () => {
  for (const [, pending] of pendingFiles.value) {
    URL.revokeObjectURL(pending.url);
  }
  pendingFiles.value.clear();
};

const finalizeUploads = async () => {
  if (!process.client)
    return { content: props.content || "", attachments: attachments.value };
  if (props.contentType !== "html")
    return { content: props.content || "", attachments: attachments.value };
  const uploadedItems: AttachmentItem[] = [];

  for (const [token, pending] of pendingFiles.value) {
    const uploaded = await uploadFile(pending.file);
    uploadedItems.push({
      id: token,
      name: uploaded.name || pending.name,
      url: uploaded.url,
      type: uploaded.type || pending.type,
      size: uploaded.size || pending.file.size,
    });
    URL.revokeObjectURL(pending.url);
    pendingFiles.value.delete(token);
  }

  const merged = [...attachments.value, ...uploadedItems];
  if (uploadedItems.length) {
    attachments.value = merged;
    emit("update:attachments", merged);
  }

  discardPendingUploads();
  return { content: props.content || "", attachments: merged };
};

const handlePasteFile = async (event: ClipboardEvent) => {
  if (props.contentType !== "html") return;
  const clipboard = event.clipboardData;
  if (!clipboard) return;

  const items = Array.from(clipboard.items || []);
  const fileItem = items.find((item) => item.kind === "file");
  if (!fileItem) return;

  const file = fileItem.getAsFile();
  if (!file) return;

  event.preventDefault();

  const quill = quillInstance.value;
  if (!quill) return;

  const range = quill.getSelection(true) || {
    index: quill.getLength(),
    length: 0,
  };
  if (file.type.startsWith("image/") && props.enableImages) {
    const base64 = await fileToBase64(file);
    quill.insertEmbed(range.index, "image", base64, "user");
    quill.setSelection(range.index + 1, 0, "silent");
    return;
  }
  if (!props.enableFiles) return;

  insertPendingFile(file);
};

// Mantém compatibilidade com o nome antigo
const handlePasteImage = (event: ClipboardEvent) => handlePasteFile(event);

const handleEditorKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter") event.stopPropagation();
};

defineExpose({
  finalizeUploads,
  discardPendingUploads,
  hasPendingUploads: () => pendingFiles.value.size > 0,
});

onBeforeUnmount(() => {
  discardPendingUploads();
});

const handleReady = (quill: any) => {
  quillInstance.value = quill;
  if (props.enableImages) {
    quill.root.addEventListener("paste", handlePasteFile);
  }
  quill.root.addEventListener("keydown", handleEditorKeydown);

  if (quill?.theme?.tooltip?.textbox) {
    quill.theme.tooltip.textbox.setAttribute(
      "placeholder",
      "https://exemplo.com",
    );
  }

  if (props.enableImages) {
    const toolbar = quill.getModule("toolbar");
    if (toolbar) {
      toolbar.addHandler("image", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const base64 = await fileToBase64(file);
            const range = quill.getSelection(true) || {
              index: quill.getLength(),
              length: 0,
            };
            quill.insertEmbed(range.index, "image", base64, "user");
            quill.setSelection(range.index + 1, 0, "silent");
          } finally {
            input.remove();
          }
        };
        input.click();
      });
    }
  }
  if (props.enableFiles) {
    const toolbar = quill.getModule("toolbar");
    if (toolbar) {
      const handleFileClick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            insertPendingFile(file);
          } finally {
            input.remove();
          }
        };
        input.click();
      };
      toolbar.addHandler("file", handleFileClick);
      // Garante que o botão exista mesmo se o toolbar não renderizar o custom
      const container = toolbar.container as HTMLElement | undefined;
      if (container && !container.querySelector("button.ql-file")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ql-file";
        btn.innerHTML = `<svg style="display:block;margin:auto;" class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 .087.586l2.977-7.937A1 1 0 0 1 6 10h12V9a2 2 0 0 0-2-2h-4.532l-1.9-2.28A2 2 0 0 0 8.032 4H4Zm2.693 8H6.5l-3 8H18l3-8H6.693Z" clip-rule="evenodd"/></svg>`;
        btn.addEventListener("click", handleFileClick);
        const imageBtn = container.querySelector("button.ql-image");
        if (imageBtn && imageBtn.parentElement) {
          imageBtn.parentElement.insertBefore(btn, imageBtn.nextSibling);
        } else {
          container.appendChild(btn);
        }
      }
    }
  }
};

onBeforeUnmount(() => {
  if (quillInstance.value?.root) {
    quillInstance.value.root.removeEventListener("paste", handlePasteFile);
    quillInstance.value.root.removeEventListener(
      "keydown",
      handleEditorKeydown,
    );
  }
  quillInstance.value = null;
});

// const toolbarOptions = [
//   [{ header: 1 }, { header: 2 }],
//   ["bold", "italic"],
//   [{ list: "ordered" }, { list: "bullet" }, "blockquote"],
// ];
</script>

<template>
  <ClientOnly>
    <div
      class="relative w-full comment-editor"
      :class="{
        'is-active': isActive,
        'toolbar-hidden': showToolbarOnFocus && !isFocused,
      }"
    >
      <QuillEditor
        :placeholder="placeholder"
        v-model:content="textContent"
        :content-type="contentType as any"
        :theme="resolvedTheme"
        :toolbar="resolvedToolbar as any"
        @ready="handleReady"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="block w-full"
      />
      <span
        class="text-[10px] text-black/60 dark:text-white/60 absolute right-2 bottom-2 z-10 pointer-events-none"
      >
        {{ displayLength }}/{{ maxLength }}
      </span>
    </div>
    <div v-if="attachmentList.length" class="mt-2">
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="item in attachmentList"
          :key="item.id"
          class="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 min-h-[32px]"
          :style="{
            borderColor: 'var(--el-border-color)',
            backgroundColor: 'var(--el-fill-color-blank)',
          }"
        >
          <button
            type="button"
            class="text-left text-xs truncate flex-1 hover:text-black dark:hover:text-white transition-colors"
            @click="openAttachment(item)"
          >
            <span class="font-medium">{{ item.name }}</span>
            <span v-if="item.size" class="ml-1 text-[10px] text-gray-500">
              ({{ formatBytes(item.size) }})
            </span>
            <span v-if="item.pending" class="ml-1 text-[10px] text-amber-600">
              Pendente
            </span>
          </button>
          <ElButton
            type="danger"
            text
            circle
            :icon="Delete"
            class="!h-6 !w-6 !p-0 flex-shrink-0"
            style="--el-icon-size: 14px"
            @click="removeAttachment(item)"
          />
        </div>
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
          :title="selectedAttachment?.name || 'Anexo'"
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
  </ClientOnly>
</template>

<style>
.ql-container {
  border: 1px solid var(--el-border-color) !important;
  border-radius: 6px !important;
  background-color: var(--el-fill-color-blank) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  height: auto !important;
  overflow: visible !important;
}

.ql-editor {
  color: var(--el-text-color-regular) !important;
  padding: 8px 12px 28px 12px !important;
  min-height: 80px !important;
  background-color: transparent !important;
  font-size: var(--el-font-size-base) !important;
  font-family: var(--el-font-family) !important;
  line-height: var(--el-line-height-base, 1.4) !important;
  box-sizing: border-box !important;
  height: auto !important;
}

.comment-editor .ql-editor [data-attachments="true"],
.comment-editor .ql-editor [data-attachments="true"] * {
  display: none !important;
}

.ql-editor.ql-blank::before {
  color: var(--el-text-color-placeholder) !important;
}

.ql-editor p {
  margin: 0;
}

.ql-toolbar {
  background-color: var(--el-fill-color-blank) !important;
  border: 1px solid var(--el-border-color) !important;
  border-bottom: none !important;
  border-top-left-radius: 6px !important;
  border-top-right-radius: 6px !important;
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.ql-toolbar + .ql-container {
  border-top: none !important;
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
  border-bottom-left-radius: 6px !important;
  border-bottom-right-radius: 6px !important;
}

.comment-editor.toolbar-hidden .ql-toolbar {
  display: none !important;
}

.comment-editor.toolbar-hidden .ql-toolbar + .ql-container {
  border-top: 1px solid var(--el-border-color) !important;
  border-top-left-radius: 6px !important;
  border-top-right-radius: 6px !important;
}

.comment-editor.is-active .ql-container,
.comment-editor.is-active .ql-toolbar,
.comment-editor:focus-within .ql-container,
.comment-editor:focus-within .ql-toolbar {
  border-color: var(--el-color-primary) !important;
}

.comment-editor.is-active,
.comment-editor:focus-within {
  box-shadow: 0 0 0 1px var(--el-color-primary) !important;
  border-radius: 6px !important;
}

.ql-toolbar button {
  color: var(--el-text-color-regular) !important;
  background-color: var(--el-fill-color-blank) !important;
}

.ql-snow .ql-stroke {
  stroke: var(--el-text-color-regular);
}

.ql-snow .ql-fill {
  fill: var(--el-text-color-regular);
}

.ql-toolbar button:hover,
.ql-toolbar button:focus,
.ql-toolbar button.ql-active {
  background-color: var(--el-fill-color-light) !important;
  border-radius: 4px !important;
  color: var(--el-text-color-primary);
}

.ql-toolbar button:hover .ql-stroke,
.ql-toolbar button:focus .ql-stroke,
.ql-toolbar button.ql-active .ql-stroke {
  stroke: var(--el-text-color-primary);
}

.ql-toolbar button:hover .ql-fill,
.ql-toolbar button:focus .ql-fill,
.ql-toolbar button.ql-active .ql-fill {
  fill: var(--el-text-color-primary);
}

.ql-snow .ql-toolbar button.ql-file::before {
  content: "";
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="M160 160v704h704V160zm-32-64h768a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H128a32 32 0 0 1-32-32V128a32 32 0 0 1 32-32"/><path d="M384 288q64 0 64 64t-64 64q-64 0-64-64t64-64M185.408 876.992l-50.816-38.912L350.72 556.032a96 96 0 0 1 134.592-17.856l1.856 1.472 122.88 99.136a32 32 0 0 0 44.992-4.864l216-269.888 49.92 39.936-215.808 269.824-.256.32a96 96 0 0 1-135.04 14.464l-122.88-99.072-.64-.512a32 32 0 0 0-44.8 5.952z"/></svg>')
    no-repeat center / contain;
  mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="M160 160v704h704V160zm-32-64h768a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H128a32 32 0 0 1-32-32V128a32 32 0 0 1 32-32"/><path d="M384 288q64 0 64 64t-64 64q-64 0-64-64t64-64M185.408 876.992l-50.816-38.912L350.72 556.032a96 96 0 0 1 134.592-17.856l1.856 1.472 122.88 99.136a32 32 0 0 0 44.992-4.864l216-269.888 49.92 39.936-215.808 269.824-.256.32a96 96 0 0 1-135.04 14.464l-122.88-99.072-.64-.512a32 32 0 0 0-44.8 5.952z"/></svg>')
    no-repeat center / contain;
}

.comment-editor .ql-toolbar button.ql-active {
  color: #79fe96 !important;
}

.comment-editor .ql-toolbar button.ql-active .ql-stroke {
  stroke: #79fe96 !important;
}

.comment-editor .ql-toolbar button.ql-active .ql-fill {
  fill: #79fe96 !important;
}

.comment-editor .ql-tooltip {
  background-color: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color) !important;
  border-radius: 8px !important;
  box-shadow: var(--el-box-shadow-light) !important;
  color: var(--el-text-color-regular) !important;
  padding: 6px 8px !important;
  z-index: 99999 !important;
}

.comment-editor .ql-tooltip::before {
  color: var(--el-text-color-regular) !important;
  content: "URL:" !important;
}

.comment-editor .ql-tooltip a {
  color: var(--el-text-color-regular) !important;
}

.comment-editor .ql-tooltip a.ql-preview {
  color: #79fe96 !important;
  text-decoration: underline !important;
}

.comment-editor .ql-tooltip.ql-editing a.ql-preview {
  color: #79fe96 !important;
  text-decoration: underline !important;
}

.comment-editor .ql-tooltip a.ql-preview:hover {
  color: #79fe96 !important;
  text-decoration: underline !important;
}

.comment-editor .ql-tooltip input[type="text"] {
  border: 1px solid var(--el-border-color) !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  background-color: var(--el-fill-color-blank) !important;
  color: var(--el-text-color-regular) !important;
}

.comment-editor .ql-tooltip input[type="text"]::placeholder {
  color: var(--el-text-color-placeholder) !important;
}

.comment-editor .ql-tooltip a.ql-action::after {
  content: "Editar" !important;
  border-right: 1px solid var(--el-border-color) !important;
}

.comment-editor .ql-tooltip.ql-editing a.ql-action::after {
  content: "Salvar" !important;
  border-right: 0 !important;
}

.comment-editor .ql-tooltip a.ql-remove::before {
  content: "Remover" !important;
}

.comment-editor .ql-tooltip[data-mode="link"]::before {
  content: "Digite o link:" !important;
}

.comment-editor .ql-tooltip[data-mode="formula"]::before {
  content: "Digite a fórmula:" !important;
}

.comment-editor .ql-tooltip[data-mode="video"]::before {
  content: "Digite o vídeo:" !important;
}

.ql-snow .ql-picker-label {
  color: var(--el-text-color-regular);
}

.ql-snow .ql-picker-label:hover {
  color: var(--el-text-color-primary);
}

.ql-snow .ql-picker.ql-expanded .ql-picker-label {
  border-color: var(--el-border-color);
  background-color: var(--el-fill-color-light);
}

.ql-snow .ql-picker-options {
  background-color: var(--el-fill-color-blank);
  border: 0.5px solid var(--el-border-color);
}

.ql-snow .ql-picker-item {
  color: var(--el-text-color-regular);
}

.ql-snow .ql-picker-item:hover,
.ql-snow .ql-picker-item.ql-selected {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.ql-editor img {
  max-width: 100%;
  height: auto;
}

.ql-editor iframe {
  width: 100%;
  height: 360px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.ql-editor a {
  color: #79fe96 !important;
  text-decoration: underline !important;
}

.ql-editor a:visited {
  color: #79fe96 !important;
}

.ql-editor a:hover {
  color: #79fe96 !important;
  text-decoration: underline !important;
  opacity: 0.85;
}
</style>
