<script setup lang="ts">
import { Lock, Loading, Check } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";

definePageMeta({
  layout: false,
  colorMode: "dark",
  auth: {
    unauthenticatedOnly: true,
  },
});

const usuario = useUsuario();
const router = useRouter();
const route = useRoute();

const tokenParam = route.query.token as string | undefined;
const formRef = ref<FormInstance | null>(null);
const formData = reactive<FormUsuarioPasswordReset>({
  novaSenha: null,
  checkNovaSenha: null,
  token: null,
});

// Validação de senha
const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-]).{6,}$/;
const formRules = reactive<FormRules<FormUsuarioPasswordReset>>({
  token: [
    {
      required: true,
      message: "O token é obrigatório",
      trigger: "change",
    },
  ],
  novaSenha: [
    {
      required: true,
      message: "O campo Nova Senha é obrigatório",
      trigger: "change",
    },
    {
      pattern: passwordPattern,
      message: "Deve incluir uma letra maiúscula, um número e caractere especial",
      trigger: "change",
    },
  ],
  checkNovaSenha: [
    {
      required: true,
      message: "O campo Confirmação de Senha é obrigatório",
      trigger: "change",
    },
    { validator: validatorCheckPassword, trigger: "change" },
  ],
});

// Validação de senha confirmada
function validatorCheckPassword(_: any, value: string, callback: Function) {
  value !== formData.novaSenha ? callback(new Error("As senhas não são iguais")) : callback();
}

// Envia os dados ao backend
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    const res = await usuario.resetPassword(formData);

    if (res) {
      ElMessage.success({
        message: "Senha alterada com sucesso!",
        plain: true,
        showClose: true,
        duration: 3000,
      });
      router.push("/");
    }
  } catch (err) {
    console.error(err);
  }
};

// Valida se os dados foram carregados e se o token é válido
const isDataLoaded = ref<boolean>(false);
onMounted(async () => {
  if (tokenParam) {
    const isValid = await usuario.validatePasswordResetToken(tokenParam as string);
    if (isValid) {
      formData.token = tokenParam as string;
      isDataLoaded.value = true;
    } else {
      ElMessage.error({
        message: "Token inválido ou expirado. Solicite uma nova recuperação de senha.",
        showClose: true,
        duration: 5000,
        plain: true,
      });
      router.push("/");
    }
  } else router.push("/");
});

// Função para lidar com a tecla Enter pressionada
const handleEnterPress = (event: KeyboardEvent) => {
  if (event.key === "Enter") handleSubmit();
};

onMounted(() => {
  window.addEventListener("keyup", handleEnterPress);
});

onUnmounted(() => {
  window.removeEventListener("keyup", handleEnterPress);
});
</script>

<template>
  <div
    class="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black/30 select-none"
  >
    <!-- Imagem de fundo -->
    <div
      class="absolute inset-0 bg-[url('/img/app-background.webp')] bg-cover bg-center bg-no-repeat z-[-2]"
    />

    <!-- Sobreposição escura para contraste -->
    <div class="absolute inset-0 bg-black/50 z-[-1]" />

    <!-- Container principal -->
    <div
      class="w-full h-full md:h-auto flex flex-col items-center justify-center max-w-md px-6 sm:px-8 py-10 bg-charcoal/60 backdrop-blur-md md:rounded-2xl shadow-xl md:ring-1 ring-white/20 space-y-6"
    >
      <!-- Formulário de login -->
      <div class="w-full space-y-6" v-if="isDataLoaded">
        <!-- Título e descrição -->
        <div class="text-start space-y-1">
          <h1 class="text-2xl font-bold text-white tracking-wide">Alteração de Senha</h1>
          <p class="text-sm text-white/70">Altere sua senha para entrar no sistema</p>
        </div>

        <!-- Formulário -->
        <ElForm
          label-position="top"
          label-width="auto"
          :rules="formRules"
          :model="formData"
          class="!space-y-8 !w-full"
          ref="formRef"
        >
          <!-- Input da senha nova -->
          <ElFormItem prop="novaSenha" required>
            <ElInput
              :disabled="usuario.isSubmitting"
              v-model="formData.novaSenha"
              placeholder="********"
              :prefix-icon="Lock"
              type="password"
              show-password
              size="large"
            />
          </ElFormItem>

          <!-- Input de confirmação senha nova -->
          <ElFormItem prop="checkNovaSenha">
            <ElInput
              v-model="formData.checkNovaSenha"
              :disabled="usuario.isSubmitting"
              placeholder="********"
              :prefix-icon="Lock"
              type="password"
              show-password
              size="large"
            />
          </ElFormItem>

          <!-- Botão de login -->
          <ElFormItem class="!mt-4">
            <ElButton @click="handleSubmit" class="w-full !rounded-md" type="primary" size="large">
              Alterar senha
            </ElButton>
          </ElFormItem>
        </ElForm>

        <!-- Rodapé -->
        <div class="text-center !mt-8 flex items-center justiyf-center w-full">
          <NuxtLink
            href="https://www.nivel3ti.com.br"
            target="_blank"
            class="hover:opacity-60 transition-opacity flex items-center justify-center w-full"
          >
            <NuxtImg
              src="/img/nivel3ti-logo.webp"
              class="h-5 md:h-5 drop-shadow-[0px_0px_2px_black]"
              alt="Logo Nível 3 TI"
            />
          </NuxtLink>
        </div>
      </div>
      <!-- Tela de Carregamento -->
      <div v-else class="flex flex-col gap-4 items-center justify-center !grow h-96 w-full">
        <ElIcon class="is-loading" color="var(--el-color-primary)" size="25">
          <Loading />
        </ElIcon>
        <span class="text-sm text-white/70 font-medium tracking-widest"> Validando Token... </span>
      </div>
    </div>
  </div>
</template>
