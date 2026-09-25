<script setup lang="ts">
import { h } from "vue";

const menu = useMenu();
const error = useErr();

const isStructuredError = (value: unknown): value is Record<string, any> =>
  Boolean(value && typeof value === "object");

const showDuplicateLeadNotification = (payload: Record<string, any>) => {
  const lead = payload.lead || {};
  const owner = payload.owner || null;

  ElNotification({
    type: "warning",
    title: payload.title || "CNPJ já cadastrado",
    duration: 14000,
    zIndex: 3000,
    customClass: "lead-duplicate-notification",
    message: h("div", { class: "space-y-3 text-sm leading-relaxed" }, [
      h("p", { class: "font-medium text-gray-800" }, payload.message),
      h("div", { class: "rounded border border-amber-200 bg-amber-50 p-3" }, [
        h("p", { class: "font-semibold text-amber-900" }, lead.nome || "Lead existente"),
        h("p", { class: "text-amber-900/80" }, `Código do lead: #${lead.id}`),
        owner
          ? h(
              "p",
              { class: "text-amber-900/80" },
              `Responsável vinculado: ${owner.nome}${owner.email ? ` (${owner.email})` : ""}`,
            )
          : h("p", { class: "text-amber-900/80" }, "Responsável vinculado: não informado"),
        h(
          "p",
          { class: "text-amber-900/80" },
          `Histórico atual: ${lead.comentarios || 0} comentário(s) e ${lead.oportunidades || 0} oportunidade(s).`,
        ),
      ]),
      h(
        "p",
        { class: "text-gray-600" },
        payload.recommendation ||
          "Use o cadastro existente para manter o histórico centralizado.",
      ),
    ]),
  });
};

// Para detectar mensagens de erros e exibir
watch(
  () => error.message,
  (err) => {
    if (err !== null && err) {
      if (
        isStructuredError(err) &&
        err.code === "LEAD_CNPJ_DUPLICATE"
      ) {
        showDuplicateLeadNotification(err);
      } else {
        ElMessage.error({
          message: String(err || "Ocorreu um erro inesperado"),
          customClass: "!z-[2500]",
          grouping: true,
          plain: true,
        });
      }

      error.setMessage(null);
    }
  }
);
</script>

<template>
  <ElContainer class="h-[500px]">
    <ElAside
      :class="{
        '!w-[220px]': menu.state.sidebar,
        '!w-[70px]': !menu.state.sidebar,
      }"
      class="md:flex flex-col !overflow-hidden h-full bg-white dark:bg-ebano py-2 hidden transition-all duration-300 ease-in-out"
    >
      <LayoutNavigation />
    </ElAside>
    <ElContainer>
      <ElHeader class="w-full bg-white dark:bg-ebano !px-0 md:!pr-8">
        <LayoutHeader />
      </ElHeader>
      <ElMain class="!p-0 !h-full dark:!bg-transparent !border-t dark:!border-white/10 !border-l">
        <ElScrollbar view-class="!h-full">
          <slot />
        </ElScrollbar>
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style>
.lead-duplicate-notification {
  width: min(460px, calc(100vw - 32px));
  z-index: 3000 !important;
}

.lead-duplicate-notification .el-notification__title {
  font-size: 16px;
  font-weight: 700;
}

.lead-duplicate-notification .el-notification__content {
  margin-top: 8px;
  text-align: left;
}
</style>
