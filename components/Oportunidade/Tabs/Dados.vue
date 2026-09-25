<script setup lang="ts">
import {
    OfficeBuilding,
    Cellphone,
    User,
    Wallet,
    ShoppingCartFull,
    Monitor,
    Cpu,
    Suitcase,
} from "@element-plus/icons-vue";

const oportunidade = useOportunidade();
</script>

<template>
    <ElScrollbar class="!h-full !w-full">
        <div class="p-4">
            <div class="flex flex-col gap-2">
                <!-- Razão social -->
                <div class="w-full space-y-1">
                    <h3>Razão Social</h3>
                    <div
                        class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                    >
                        <ElIcon>
                            <OfficeBuilding />
                        </ElIcon>
                        {{ oportunidade.data?.lead?.nome_lead }}
                    </div>
                </div>
                <div
                    class="flex flex-col md:flex-row w-full items-center gap-4"
                >
                    <!-- Telefone para contato -->
                    <div class="w-full space-y-1">
                        <h3>Telefone para Contato</h3>
                        <div
                            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                            :class="{
                                'py-3': !oportunidade.data?.lead?.contato,
                            }"
                        >
                            <ElIcon>
                                <Cellphone />
                            </ElIcon>
                            <a
                                v-if="oportunidade.data?.lead?.contato"
                                :href="toTel(oportunidade.data?.lead?.contato)"
                                class="underline transition-opacity hover:opacity-70"
                            >
                                {{
                                    formatPhone(
                                        String(
                                            oportunidade.data?.lead?.contato,
                                        ),
                                    )
                                }}
                            </a>
                            <span v-else></span>
                        </div>
                    </div>
                    <!-- Nome do Contato -->
                    <div class="w-full space-y-1">
                        <h3>Nome do Contato</h3>
                        <div
                            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
                            :class="{
                                'py-3': !oportunidade.data?.lead?.contato_nome,
                            }"
                        >
                            <ElIcon>
                                <User />
                            </ElIcon>
                            {{ oportunidade.data?.lead?.contato_nome }}
                        </div>
                    </div>
                </div>
                <div class="flex flex-col gap-2 !break-all">
                    <!-- Tipo de serviço -->
                    <div
                        class="flex flex-col md:flex-row w-full items-center gap-4 !break-all"
                    >
                        <div class="w-full space-y-1">
                            <h3 class="!text-nowrap">Tipo de Serviço</h3>
                            <div
                                class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 rounded"
                                :class="
                                    oportunidade.data?.tipo ? 'py-2' : 'py-3'
                                "
                            >
                                <ElIcon>
                                    <Suitcase />
                                </ElIcon>
                                {{ oportunidade.data?.tipo }}
                            </div>
                        </div>
                        <!-- Infraestrutura -->
                        <div class="w-full space-y-1">
                            <h3 class="!text-nowrap">Infraestrutura</h3>
                            <div
                                class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 rounded"
                                :class="
                                    oportunidade.data?.infraestrutura
                                        ? 'py-2'
                                        : 'py-3'
                                "
                            >
                                <ElIcon>
                                    <Cpu />
                                </ElIcon>
                                {{ oportunidade.data?.infraestrutura }}
                            </div>
                        </div>
                    </div>
                    <div
                        class="flex flex-col md:flex-row w-full items-center gap-4 !break-all"
                    >
                        <!-- Número de Lojas -->
                        <div class="w-full space-y-1">
                            <h3>Nº de Lojas</h3>
                            <div
                                class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 rounded"
                                :class="
                                    oportunidade.data?.num_lojas
                                        ? 'py-2'
                                        : 'py-3'
                                "
                            >
                                <ElIcon>
                                    <ShoppingCartFull />
                                </ElIcon>
                                {{
                                    formatNumber(
                                        String(oportunidade.data?.num_lojas),
                                    )
                                }}
                            </div>
                        </div>
                        <!-- Número de PDVs -->
                        <div class="w-full space-y-1">
                            <h3>Nº de PDVs</h3>
                            <div
                                class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 rounded"
                                :class="
                                    oportunidade.data?.num_pdvs
                                        ? 'py-2'
                                        : 'py-3'
                                "
                            >
                                <ElIcon>
                                    <Monitor />
                                </ElIcon>
                                {{
                                    formatNumber(
                                        String(oportunidade.data?.num_pdvs),
                                    )
                                }}
                            </div>
                        </div>
                    </div>
                    <!-- Faixa de Valor -->
                    <div
                        class="flex flex-col md:flex-row w-full items-center gap-4 !break-all"
                    >
                        <div class="w-full md:w-fit space-y-1">
                            <h3 class="text-nowrap">Faixa de Valor</h3>
                            <div
                                class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 rounded"
                                :class="
                                    oportunidade.data?.faixa_valor
                                        ? 'py-2'
                                        : 'py-3'
                                "
                            >
                                {{ oportunidade.data?.faixa_valor }}
                            </div>
                        </div>
                        <!-- Valor Estimado -->
                        <div class="w-full space-y-1">
                            <h3 class="text-nowrap">Valor Estimado</h3>
                            <div
                                class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 rounded"
                                :class="
                                    oportunidade.data?.valor_estimado
                                        ? 'py-2'
                                        : 'py-3'
                                "
                            >
                                <ElIcon>
                                    <Wallet />
                                </ElIcon>
                                {{
                                    formatNumber(
                                        String(
                                            oportunidade.data?.valor_estimado,
                                        ),
                                    )
                                }}
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    class="w-full h-[0.5px] bg-black/20 dark:bg-white/20 mt-2"
                />
                <!-- Descrição -->
                <div>
                    <div class="w-full space-y-1">
                        <h3>Descrição</h3>
                        <div
                            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded !break-all !whitespace-break-spaces space-y-1"
                        >
                            {{
                                oportunidade.data?.descricao
                                    ? oportunidade.data?.descricao
                                    : "Sem descrição"
                            }}
                        </div>
                    </div>
                </div>
                <!-- Observações -->
                <div>
                    <div class="w-full space-y-1">
                        <h3>Observações</h3>
                        <div
                            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded !break-all !whitespace-break-spaces space-y-1"
                        >
                            {{
                                oportunidade.data?.observacoes
                                    ? oportunidade.data?.observacoes
                                    : "Sem observações"
                            }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </ElScrollbar>
</template>
