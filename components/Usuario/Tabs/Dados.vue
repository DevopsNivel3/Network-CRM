<script setup lang="ts">
import {
  OfficeBuilding,
  Cellphone,
  Postcard,
  User,
  Promotion,
  Place,
} from "@element-plus/icons-vue";

const { isDark } = useTheme();
const usuario = useUsuario();
</script>

<template>
  <ElScrollbar class="!h-full !w-full">
    <div class="p-4 flex flex-col gap-2">
      <!-- Aparece caso a empresa esteja inativa -->
      <ElAlert
        v-if="usuario.data?.empresa?.desativado"
        title="A Empresa está inativa, portanto este usuário não possui permissão para acessar o sistema."
        :effect="isDark ? 'light' : 'dark'"
        class="!text-balance !py-4"
        :closable="false"
        type="warning"
        show-icon
      />
      <!-- Aparece caso o usuário esteja inativo -->
      <ElAlert
        v-else-if="usuario.data?.desativado"
        title="O usuário está com a conta inativa, portanto não possui permissão para acessar o sistema."
        :effect="isDark ? 'light' : 'dark'"
        class="!text-balance !py-4"
        :closable="false"
        type="warning"
        show-icon
      />
      <div class="flex flex-col md:flex-row w-full items-center gap-4">
        <!-- Mostra o avatar do usuário -->
        <ElAvatar
          class="!min-w-24 !min-h-24 md:!min-w-16 md:!min-h-16 !text-black dark:!text-white !font-semibold !border-[2px]"
          :class="
            usuario.data?.online
              ? '!border-green-500'
              : '!border-gray-400 dark:!border-gray-500'
          "
          :src="parserAvatar(usuario.data?.avatar)"
        >
          <span class="font-medium uppercase">
            {{ usuario.data?.nome.slice(0, 1) }}
          </span>
        </ElAvatar>
        <!-- Mostra o nome do usuário -->
        <div class="w-full space-y-1">
          <h3>Nome</h3>
          <div
            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
          >
            <ElIcon>
              <User />
            </ElIcon>
            {{ usuario.data?.nome }}
          </div>
        </div>
        <!-- Mostra o e-mail do usuário -->
        <div class="w-full space-y-1">
          <h3>E-mail</h3>
          <div
            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
            :class="{
              'py-3': !usuario.data?.email,
            }"
          >
            <ElIcon>
              <Postcard />
            </ElIcon>
            <a
              :href="toMail(usuario.data?.email)"
              class="underline transition-opacity hover:opacity-70 cursor-pointer"
            >
              {{ usuario.data?.email }}
            </a>
          </div>
        </div>
      </div>
      <!-- Mostra o telefone para contato -->
      <div class="w-full space-y-1">
        <h3>Telefone para Contato</h3>
        <div
          class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
        >
          <ElIcon>
            <Cellphone />
          </ElIcon>
          <a
            :href="toTel(usuario.data?.contato)"
            class="underline transition-opacity hover:opacity-70"
          >
            {{ formatPhone(String(usuario.data?.contato)) }}
          </a>
        </div>
      </div>
      <div class="w-full space-y-1">
        <h3>CPF</h3>
        <div
          class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
        >
          <ElIcon>
            <Postcard />
          </ElIcon>
          {{
            usuario.data?.cpf
              ? formatCPF_CNPJ(usuario.data.cpf)
              : "Não informado"
          }}
        </div>
      </div>
      <div
        class="flex flex-col md:flex-row w-full items-center text-wrap md:text-nowrap gap-4"
      >
        <!-- Mostra o número de leads -->
        <div class="w-full space-y-1">
          <h3>Nº de Leads</h3>
          <div
            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
          >
            <ElIcon>
              <OfficeBuilding />
            </ElIcon>
            {{ formatNumber(String(usuario.data?._count?.leads)) }}
          </div>
        </div>
        <!-- Mostra o número de oportunidades -->
        <div class="w-full space-y-1">
          <h3>Nº de Oportunidades</h3>
          <div
            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
          >
            <ElIcon>
              <Promotion />
            </ElIcon>
            {{ formatNumber(String(usuario.data?._count?.oportunidades)) }}
          </div>
        </div>
        <!-- Mostra o número de visitas -->
        <div class="w-full space-y-1">
          <h3>Nº de Visitas</h3>
          <div
            class="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded"
          >
            <ElIcon>
              <Place />
            </ElIcon>
            {{ formatNumber(String(usuario.data?._count?.visitas)) }}
          </div>
        </div>
      </div>
    </div>
  </ElScrollbar>
</template>
