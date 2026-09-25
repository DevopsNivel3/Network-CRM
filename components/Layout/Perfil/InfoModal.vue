<script setup lang="ts">
import {
    User,
    Postcard,
    Cellphone,
    Check,
    Delete,
    Plus,
} from "@element-plus/icons-vue";
import type {
    FormInstance,
    UploadInstance,
    UploadProps,
    UploadRawFile,
} from "element-plus";
import { genFileId } from "element-plus";

const { getSession } = useAuth();
const { handleFileInput, files } = useFileStorage();
const usuario = useUsuario();
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

const uploadRef = ref<UploadInstance>();
const formRef = ref<FormInstance | null>(null);
const removeAvatar = ref(false);
const formRules = reactive(FormUpdateUsuarioRules);
const formData = reactive<FormUsuarioCreate>({
    nome: null,
    contato: null,
    email: null,
    senha: null,
    avatar: null,
    image: null,
    permissoes: null,
});

const previewAvatar = computed(() => {
    if (files.value.length > 0) return files.value[0]?.content;
    if (removeAvatar.value) return undefined;
    return parserAvatar(usuario.data?.avatar);
});
const hasAvatar = computed(() => !!previewAvatar.value);

const resetFormData = () => {
    formData.nome = usuario.data?.nome || null;
    formData.contato = usuario.data?.contato || null;
    formData.email = usuario.data?.email || null;
    formData.image = null;
};

const loadProfile = async () => {
    const isLoaded = await usuario.findSelf();
    if (!isLoaded) return;
    resetFormData();
};

const handleImageChange: UploadProps["onChange"] = (file) => {
    formData.image = file ? file.name : null;
    removeAvatar.value = false;
};
const handleImageRemove: UploadProps["onRemove"] = () => {
    formData.image = null;
};
const handleImageExceed: UploadProps["onExceed"] = (uploadedFiles) => {
    uploadRef.value?.clearFiles();
    const file = uploadedFiles[0] as UploadRawFile;
    file.uid = genFileId();
    uploadRef.value?.handleStart(file);
    removeAvatar.value = false;
};
const handleRemoveCurrentAvatar = async () => {
    try {
        const isUpdated = await usuario.updateProfile({
            removeAvatar: true,
        });
        if (!isUpdated) return;

        await getSession();
        formData.image = null;
        files.value = [];
        removeAvatar.value = false;
        uploadRef.value?.clearFiles();
        resetFormData();

        ElMessage.success({
            message: "Foto removida com sucesso!",
            plain: true,
        });
    } catch (err) {
        console.error(err);
    }
};

const closeDialog = () => {
    formRef.value?.resetFields();
    removeAvatar.value = false;
    files.value = [];
    uploadRef.value?.clearFiles();
    isOpen.value = false;
};

const handleSubmit = async () => {
    try {
        await formRef.value?.validate();

        const isUpdated = await usuario.updateProfile({
            nome: formData.nome,
            contato: formData.contato,
            email: formData.email,
            image: files.value[0] || null,
            removeAvatar: removeAvatar.value,
        });
        if (!isUpdated) return;

        await getSession();
        ElMessage.success({
            message: "Perfil atualizado com sucesso!",
            plain: true,
        });
        closeDialog();
    } catch (err) {
        console.error(err);
    }
};

watch(
    () => isOpen.value,
    async (open) => {
        if (open) {
            await loadProfile();
            return;
        }

        formRef.value?.resetFields();
        removeAvatar.value = false;
        files.value = [];
        uploadRef.value?.clearFiles();
    },
);
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[600px]"
        title="Meu Perfil"
        v-model="isOpen"
        @close="closeDialog"
        destroy-on-close
        :show-close="false"
        :z-index="1500"
        align-center
    >
        <template #header>
            <UIDialogHeader title="Meu Perfil" @close="closeDialog" />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <div class="flex flex-col md:flex-row items-end gap-4 mb-4">
                <div class="relative group">
                    <ElAvatar
                        class="!text-black dark:!text-white !font-semibold !min-w-24 !max-w-24 !min-h-24 !max-h-24"
                        :src="previewAvatar"
                    >
                        <span class="font-medium uppercase">
                            {{ (formData.nome || "U").slice(0, 1) }}
                        </span>
                    </ElAvatar>
                    <ElUpload
                        :on-exceed="handleImageExceed"
                        :on-change="handleImageChange"
                        :on-remove="handleImageRemove"
                        v-model="formData.image"
                        @input="handleFileInput"
                        :autoUpload="false"
                        :show-file-list="false"
                        ref="uploadRef"
                        class="profile-avatar-upload !absolute !inset-0 !rounded-full !overflow-hidden"
                        :limit="1"
                    >
                        <div
                            class="h-full w-full rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <ElIcon size="20">
                                <Plus />
                            </ElIcon>
                        </div>
                    </ElUpload>
                    <ElTooltip
                        v-if="hasAvatar"
                        effect="light"
                        content="Remover foto"
                        placement="top"
                    >
                        <ElButton
                            circle
                            size="small"
                            type="danger"
                            class="!absolute !-bottom-1 !-right-1 !z-10 !mr-2 !mb-2"
                            :icon="Delete"
                            @click="handleRemoveCurrentAvatar"
                        />
                    </ElTooltip>
                </div>
                <div class="w-full">
                    <ElFormItem label="Nome" prop="nome" required>
                        <ElInput
                            placeholder="Digite seu nome"
                            :disabled="usuario.isSubmitting"
                            :maxlength="maxLengthText"
                            v-model="formData.nome"
                            :prefix-icon="User"
                            size="large"
                            clearable
                        />
                    </ElFormItem>
                </div>
            </div>

            <ElFormItem label="E-mail" prop="email" required>
                <ElInput
                    placeholder="exemplo@email.com"
                    :disabled="usuario.isSubmitting"
                    :maxlength="maxLengthText"
                    v-model="formData.email"
                    :prefix-icon="Postcard"
                    size="large"
                    clearable
                />
            </ElFormItem>
            <ElFormItem label="Telefone para Contato" prop="contato" required>
                <ElInput
                    :disabled="usuario.isSubmitting"
                    :maxlength="maxLengthPhone"
                    v-model="formData.contato"
                    placeholder="00 0000-0000"
                    :prefix-icon="Cellphone"
                    :formatter="formatPhone"
                    :parser="onlyNumber"
                    size="large"
                    clearable
                />
            </ElFormItem>
        </ElForm>
        <template #footer>
            <ElButton @click="closeDialog">Cancelar</ElButton>
            <ElButton
                :loading="usuario.isSubmitting"
                :disabled="usuario.isSubmitting"
                @click="handleSubmit"
                type="primary"
                :icon="Check"
            >
                Salvar
            </ElButton>
        </template>
    </ElDialog>
</template>

<style scoped>
:deep(.profile-avatar-upload .el-upload) {
    width: 100%;
    height: 100%;
    border-radius: 9999px;
}
</style>
