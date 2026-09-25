<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";

const exigeMotivo = defineModel<boolean>("exigeMotivo", { default: false });
const grupoMotivos = defineModel<string | null>("grupoMotivos", { default: null });
const motivos = defineModel<string[]>("motivos", { default: () => [] });
const exigirObsOutro = defineModel<boolean>("exigirObsOutro", { default: false });
const oportunidades = useOportunidades();
const novoMotivo = ref("");
const motivoExistente = ref<string | null>(null);

const motivosCadastrados = computed(() => {
    const cadastrados = new Map<
        string,
        { value: string; boards: Set<string> }
    >();

    (oportunidades.boards.data || []).forEach((board) => {
        (Array.isArray(board.motivos) ? board.motivos : []).forEach((motivo) => {
            const value = motivo.trim();
            if (!value) return;
            const key = value.toLocaleLowerCase("pt-BR");
            const item = cadastrados.get(key) || {
                value,
                boards: new Set<string>(),
            };
            item.boards.add(board.titulo);
            cadastrados.set(key, item);
        });
    });

    const selecionados = new Set(
        motivos.value.map((motivo) => motivo.toLocaleLowerCase("pt-BR")),
    );

    return [...cadastrados.entries()]
        .filter(([key]) => !selecionados.has(key))
        .map(([, item]) => ({
            value: item.value,
            boards: [...item.boards].sort((a, b) => a.localeCompare(b, "pt-BR")),
        }))
        .sort((a, b) => a.value.localeCompare(b.value, "pt-BR"));
});

const adicionarMotivo = () => {
    const motivo = novoMotivo.value.trim();
    if (!motivo) return;
    if (!motivos.value.some((item) => item.toLowerCase() === motivo.toLowerCase())) {
        motivos.value = [...motivos.value, motivo];
    }
    novoMotivo.value = "";
};

const adicionarMotivoExistente = (motivo: string | null) => {
    if (!motivo) return;
    if (!motivos.value.some((item) => item.toLocaleLowerCase("pt-BR") === motivo.toLocaleLowerCase("pt-BR"))) {
        motivos.value = [...motivos.value, motivo];
    }
    motivoExistente.value = null;
};

const removerMotivo = (index: number) => {
    motivos.value = motivos.value.filter((_, itemIndex) => itemIndex !== index);
};

onMounted(async () => {
    if (!oportunidades.boards.data?.length) await oportunidades.findAllBoards();
});
</script>

<template>
    <div class="mt-4 pt-4 border-t dark:border-white/10">
        <h3 class="text-sm font-semibold mb-3">Configurações da Coluna</h3>
        <ElFormItem class="w-full">
            <ElCheckbox v-model="exigeMotivo">Exige motivo ao mover para esta etapa</ElCheckbox>
        </ElFormItem>
        <template v-if="exigeMotivo">
            <ElFormItem label="Grupo de motivos" class="w-full">
                <ElInput v-model="grupoMotivos" maxlength="100" placeholder="Ex.: Declínio de Cotação" clearable />
            </ElFormItem>
            <ElFormItem label="Motivos disponíveis" class="w-full">
                <div v-if="motivosCadastrados.length" class="w-full">
                    <ElSelect
                        v-model="motivoExistente"
                        class="w-full"
                        placeholder="Selecione um motivo já cadastrado"
                        filterable
                        clearable
                        @change="adicionarMotivoExistente"
                    >
                        <ElOption
                            v-for="item in motivosCadastrados"
                            :key="item.value"
                            :label="item.value"
                            :value="item.value"
                        >
                            <div class="flex min-w-0 items-center justify-between gap-3">
                                <span class="truncate">{{ item.value }}</span>
                                <span class="shrink-0 text-[10px] text-gray-400">
                                    {{ item.boards.join(", ") }}
                                </span>
                            </div>
                        </ElOption>
                    </ElSelect>
                    <div class="my-3 flex items-center gap-3 text-[10px] uppercase text-gray-400">
                        <span class="h-px flex-1 bg-black/10 dark:bg-white/10" />
                        ou cadastre um novo
                        <span class="h-px flex-1 bg-black/10 dark:bg-white/10" />
                    </div>
                </div>
                <div class="flex w-full flex-col gap-2 sm:flex-row">
                    <ElInput v-model="novoMotivo" maxlength="100" placeholder="Digite um motivo" @keyup.enter.prevent="adicionarMotivo" />
                    <ElButton :icon="Plus" @click="adicionarMotivo">Adicionar</ElButton>
                </div>
                <div v-if="motivos.length" class="flex flex-wrap gap-2 mt-3">
                    <ElTag v-for="(motivo, index) in motivos" :key="`${motivo}-${index}`" closable @close="removerMotivo(index)">{{ motivo }}</ElTag>
                </div>
                <p v-else class="text-xs text-red-500 mt-2">Cadastre pelo menos um motivo.</p>
            </ElFormItem>
            <ElFormItem class="w-full">
                <ElCheckbox v-model="exigirObsOutro">Exigir observação quando “Outro” for selecionado</ElCheckbox>
                <p class="w-full text-xs text-black/60 dark:text-white/60 mt-1">A opção “Outro” será adicionada automaticamente na movimentação.</p>
            </ElFormItem>
        </template>
    </div>
</template>
