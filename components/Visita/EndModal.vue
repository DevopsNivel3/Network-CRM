<script setup lang="ts">
import type {
    UploadInstance,
    FormInstance,
    UploadProps,
    UploadRawFile,
} from "element-plus";
import { UploadFilled, MapLocation } from "@element-plus/icons-vue";
import { genFileId } from "element-plus";

const { handleFileInput, files } = useFileStorage();
const oportunidade = useOportunidade();
const { getCoords } = useLocation();
const visitas = useVisitas();
const visita = useVisita();
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
const formRules = reactive(FormEndVisitaRules);
const formData = reactive<FormVisitaCreate>({
    latitude: null,
    longitude: null,
    imagem_src: null,
});

// Fecha o modal
const closeEndModal = () => {
    if (formRef.value) formRef.value.resetFields();
    isOpen.value = false;
};

// Pega a localização do usuário e salva no form
const handleGetlocation = async () => {
    try {
        const res = await getCoords();
        if (res) {
            formData.latitude = res.latitude;
            formData.longitude = res.longitude;
        } else {
            ElMessage.error({
                message: "Erro ao obter dados da localização!",
                customClass: "!z-[2500]",
                grouping: true,
                plain: true,
            });
        }
    } catch (err: any) {
        ElMessage.error({
            message: err?.message || err,
            customClass: "!z-[2500]",
            grouping: true,
            plain: true,
        });
    }
};

// Ao abrir o modal pega a localização do usuário
watch(
    () => isOpen.value,
    async (isOpen) => {
        if (isOpen) {
            await handleGetlocation();
        }
    },
);

// Envia aos dados ao backend
const handleEnd = async () => {
    if (visita.isSubmitting) return;
    if (!formData.latitude || !formData.longitude)
        return ElMessage.error({
            message:
                "A localização precisa ser obtida antes de finalizar a visita!",
            customClass: "!z-[2500]",
            plain: true,
        });

    try {
        await formRef.value?.validate();

        const visitaId = visita.data!.id;
        const isVisitaStatusEnded = await visita.updateById(visitaId, {
            ...formData,
            data_fim: new Date().toISOString(),
            image: files.value[0],
            statusInt: 5, // Concluído
        });

        if (isVisitaStatusEnded) {
            ElMessage.success({
                message: "Visita finalizada com sucesso!",
                customClass: "!z-[2500]",
                plain: true,
            });

            visitas.updateStatusFromState(visitaId, 5);
            if (oportunidade.hasVisitas)
                oportunidade.updateVisitaFromState(visitaId, { statusInt: 5 });

            closeEndModal();
        }
    } catch (err) {
        console.error(err);
    }
};

// Função para o upload de imagem
const handleExceed: UploadProps["onExceed"] = (files) => {
    uploadRef.value!.clearFiles();
    const file = files[0] as UploadRawFile;
    file.uid = genFileId();
    uploadRef.value!.handleStart(file);
};
const handleChange: UploadProps["onChange"] = (file) =>
    (formData.imagem_src = file ? file.name : null);
const handleRemove: UploadProps["onRemove"] = () =>
    (formData.imagem_src = null);
</script>

<template>
    <ElDialog
        class="!w-full md:!w-[400px]"
        v-model="isOpen"
        title="Concluir Visita"
        @close="closeEndModal"
        destroy-on-close
        :z-index="1515"
        :show-close="false"
        align-center
    >
        <template #header>
            <UIDialogHeader title="Concluir Visita" @close="closeEndModal" />
        </template>
        <ElForm
            label-position="top"
            label-width="auto"
            :rules="formRules"
            :model="formData"
            ref="formRef"
        >
            <div class="mb-3">
                <div>
                    <div class="flex items-center gap-2">
                        <h4 class="truncate">Localização atual</h4>
                        <ElButton
                            class="!flex !items-center !text-blue-400"
                            @click="handleGetlocation"
                            :icon="MapLocation"
                            size="small"
                        >
                            Atualizar
                        </ElButton>
                    </div>
                    <div
                        class="flex mt-2 items-center justify-between px-4 py-2 bg-black/5 dark:bg-white/5 rounded-t"
                    >
                        <span>
                            Latitude: {{ formData.latitude || "0.000" }}</span
                        >
                        <div
                            class="w-[0.5px] h-4 bg-black/40 dark:bg-white/20"
                        />
                        <span>
                            Longitude: {{ formData.longitude || "0.000" }}
                        </span>
                    </div>
                    <UIMapbox
                        :coords="[
                            Number(formData.latitude),
                            Number(formData.longitude),
                        ]"
                    />
                </div>
            </div>
            <ElFormItem
                label="Imagem do Local"
                prop="imagem_src"
                class="w-full"
            >
                <ElUpload
                    v-model="formData.imagem_src"
                    :on-change="handleChange"
                    :on-remove="handleRemove"
                    :on-exceed="handleExceed"
                    @input="handleFileInput"
                    :autoUpload="false"
                    ref="uploadRef"
                    class="!w-full"
                    :limit="1"
                    drag
                >
                    <ElIcon size="40">
                        <UploadFilled />
                    </ElIcon>
                    <div>
                        Solte o arquivo aqui ou
                        <em>clique para fazer upload</em>
                    </div>
                </ElUpload>
            </ElFormItem>
        </ElForm>
        <template #footer>
            <ElButton @click="closeEndModal">Fechar</ElButton>
            <ElButton
                :disabled="visita.isSubmitting"
                @click="handleEnd"
                type="primary"
            >
                Sim, concluir!
            </ElButton>
        </template>
    </ElDialog>
</template>
