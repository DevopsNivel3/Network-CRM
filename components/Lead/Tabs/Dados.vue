<script setup lang="ts">
import {
    OfficeBuilding,
    Postcard,
    Management,
    Briefcase,
    UserFilled,
    Wallet,
    InfoFilled,
    Cellphone,
    User,
    Location,
} from "@element-plus/icons-vue";

const lead = useLead();
</script>

<template>
    <ElScrollbar class="!h-full !w-full">
        <div class="p-4 flex flex-col gap-2">
            <!-- Mostra o Id no Mobile -->
            <ElAlert
                :title="`ID #${lead.data?.id}`"
                class="!flex md:!hidden"
                :closable="false"
                type="info"
                show-icon
            />
            <div class="flex flex-col md:flex-row w-full items-center gap-4">
                <!-- Mostra a razão social -->
                <div class="w-full space-y-1">
                    <h3>Razão Social</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                    >
                        <ElIcon>
                            <OfficeBuilding />
                        </ElIcon>
                        {{ lead.data?.nome_lead }}
                    </div>
                </div>
                <!-- Mostra o CPF/CNPJ -->
                <div class="w-full space-y-1">
                    <h3>CPF/CNPJ</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                        :class="{
                            'py-3': !lead.data?.cpf_cnpj,
                        }"
                    >
                        <ElIcon>
                            <Postcard />
                        </ElIcon>
                        {{ formatCPF_CNPJ(String(lead.data?.cpf_cnpj)) }}
                    </div>
                </div>
            </div>
            <!-- Mostra Responsável -->
            <div class="flex flex-col md:flex-row w-full items-center gap-4">
                <div class="w-full space-y-1">
                    <h3>Responsável</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                        :class="{
                            'py-3': !lead.data?.responsavel,
                        }"
                    >
                        <ElIcon>
                            <Management />
                        </ElIcon>
                        {{ lead.data?.responsavel }}
                    </div>
                </div>
                <!-- Mostra a atividade -->
                <div class="w-full space-y-1">
                    <h3>Atividade</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                        :class="{
                            'py-3': !lead.data?.atividade,
                        }"
                    >
                        <ElIcon>
                            <Briefcase />
                        </ElIcon>
                        {{ lead.data?.atividade }}
                    </div>
                </div>
            </div>
            <div class="flex flex-col md:flex-row w-full items-center gap-4">
                <!-- Mostra o número de colaboradores -->
                <div class="w-full md:w-fit space-y-1 md:text-nowrap">
                    <h3>Nº de Colaboradores</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                        :class="{
                            'py-3': !lead.data?.num_funcionarios,
                        }"
                    >
                        <ElIcon>
                            <UserFilled />
                        </ElIcon>
                        {{ formatNumber(String(lead.data?.num_funcionarios)) }}
                    </div>
                </div>
                <!-- Mostra o faturamento -->
                <div class="w-full space-y-1">
                    <h3>Faturamento</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                        :class="{
                            'py-3': !lead.data?.faturamento,
                        }"
                    >
                        <ElIcon>
                            <Wallet />
                        </ElIcon>
                        {{ formatNumber(String(lead.data?.faturamento)) }}
                    </div>
                </div>
            </div>
            <!-- Mostra a fonte de contato -->
            <div class="w-full space-y-1">
                <h3>Fonte de Contato</h3>
                <div
                    class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                    :class="{ 'py-3': !lead.data?.origem_lead }"
                >
                    <ElIcon>
                        <InfoFilled />
                    </ElIcon>
                    {{ lead.data?.origem_lead }}
                </div>
            </div>
            <div class="flex flex-col md:flex-row w-full items-center gap-4">
                <!-- Mostra o telefone para contato -->
                <div class="w-full space-y-1">
                    <h3>Telefone para Contato</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                        :class="{
                            'py-3': !lead.data?.contato,
                        }"
                    >
                        <ElIcon>
                            <Cellphone />
                        </ElIcon>
                        <a
                            v-if="lead.data?.contato"
                            :href="toTel(lead.data?.contato)"
                            class="underline transition-opacity hover:opacity-70"
                        >
                            {{ formatPhone(String(lead.data?.contato)) }}
                        </a>
                        <span v-else></span>
                    </div>
                </div>
                <!-- Mostra o nome do contato -->
                <div class="w-full space-y-1">
                    <h3>Nome do Contato</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                        :class="{
                            'py-3': !lead.data?.contato_nome,
                        }"
                    >
                        <ElIcon>
                            <User />
                        </ElIcon>
                        {{ lead.data?.contato_nome }}
                    </div>
                </div>
            </div>
            <!-- Mostra as localizações -->
            <div v-if="lead.data!.localizacoes?.length > 0">
                <UIDivider text="Localizações" />
                <div class="my-1 flex flex-col gap-2">
                    <div
                        v-for="(localizacao, index) in lead.data?.localizacoes"
                        class="flex flex-col w-full"
                        :key="index"
                    >
                        <!-- Mostra o Endereço -->
                        <div class="w-full space-y-1">
                            <h3>Endereço {{ index + 1 }}</h3>
                            <div
                                class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                            >
                                <ElIcon>
                                    <Location />
                                </ElIcon>
                                {{
                                    [
                                        localizacao.rua,
                                        localizacao.numero
                                            ? `Nº ${localizacao.numero}`
                                            : null,
                                        localizacao.cidade,
                                        localizacao.estado,
                                        localizacao.cep
                                            ? formatCep(localizacao.cep)
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")
                                }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ElScrollbar>
</template>
