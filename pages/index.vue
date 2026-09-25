<script setup lang="ts">
import { User, Lock } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";

const { login } = useAuthSession();
const usuario = useUsuario();

definePageMeta({
    layout: false,
    colorMode: "dark",
    auth: {
        unauthenticatedOnly: true,
        navigateAuthenticatedTo: "/inicio",
    },
});

const loginState = reactive({
    isLoading: false,
    isError: false,
    isBlocked: false,
    attempts: 0,
    timer: 0,
});

const formRef = ref<FormInstance>();
const formRules = reactive(FormLoginRules);
const formData = reactive<FormLogin>({
    email: "",
    senha: "",
});

// Função para iniciar o temporizador de bloqueio de login em 30 segundos
const startBlockTimer = () => {
    loginState.isBlocked = true;
    loginState.timer = 30;

    const interval = setInterval(() => {
        loginState.timer -= 1;

        if (loginState.timer <= 0) {
            clearInterval(interval);
            loginState.isBlocked = false;
            loginState.attempts = 0;
        }
    }, 1000);
};

// Função para lidar com o envio dos dados de login
const handleSubmit = async () => {
    if (loginState.isLoading || loginState.isBlocked) return;
    loginState.isLoading = true;
    loginState.isError = false;

    try {
        await formRef.value?.validate();
        await login(formData).catch(() => {
            loginState.attempts += 1;
            if (loginState.attempts >= 5) {
                loginState.isError = false;
                startBlockTimer();
            } else loginState.isError = true;
        });
    } catch (err) {
        console.error(err);
    } finally {
        loginState.isLoading = false;
    }
};

const sendResetPasswordEmail = async () => {
    const email = formData.email.trim();
    const isValidEmail = /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/.test(
        email,
    );

    if (!email || !isValidEmail) {
        formRef.value?.validateField("email");
        formRef.value?.clearValidate("senha");
        return;
    }

    loginState.isLoading = true;
    try {
        const isEmailSent = await usuario.sendPasswordResetEmail(email);

        ElMessage({
            type: isEmailSent ? "success" : "error",
            message: isEmailSent
                ? "E-mail de redefinição enviado com sucesso!"
                : "Erro ao enviar o e-mail, tente novamente mais tarde.",
            duration: 3000,
            showClose: true,
            grouping: true,
            plain: true,
        });
    } catch (err) {
        ElMessage({
            type: "error",
            message: "Erro inesperado ao enviar o e-mail.",
            duration: 3000,
            showClose: true,
            grouping: true,
            plain: true,
        });
    } finally {
        loginState.isLoading = false;
    }
};

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
            class="w-full h-full md:h-auto md:max-w-5xl md:grid md:grid-cols-[1.05fr_0.95fr] bg-charcoal/60 backdrop-blur-md md:rounded-3xl md:shadow-2xl md:ring-1 md:ring-white/20 md:overflow-hidden"
        >
            <!-- Painel visual desktop -->
            <div
                class="hidden md:flex relative items-end p-10 bg-black/40 border-r border-white/10"
            >
                <div
                    class="absolute inset-0 bg-gradient-to-br from-cyan-400/15 via-transparent to-emerald-300/15"
                />
                <div
                    class="relative inset-0 flex items-center justify-center flex-col h-full w-full z-10 space-y-12"
                >
                    <NuxtImg
                        src="/img/network-logo-dark.webp"
                        width="180"
                        height="180"
                        alt="Logo N3TWORK"
                        class="drop-shadow-[0px_0px_70px_white]"
                    />
                    <div class="flex flex-col gap-2">
                        <h2
                            class="text-2xl font-semibold text-white leading-tight max-w-sm"
                        >
                            Plataforma de Gestão Integrada
                        </h2>
                        <p class="text-sm text-white/70 max-w-sm">
                            Acesse com segurança para centralizar processos,
                            indicadores e operações de todos os módulos em um
                            único painel.
                        </p>
                    </div>
                </div>
            </div>

            <div
                class="w-full h-full md:h-auto flex flex-col items-center justify-center max-w-md md:max-w-none mx-auto px-6 sm:px-8 py-10 md:px-12 md:py-12 space-y-6"
            >
                <!-- Logo -->
                <div class="flex justify-center md:hidden">
                    <NuxtImg
                        src="/img/network-logo-dark.webp"
                        width="100"
                        height="100"
                        alt="Logo N3TWORK"
                        class="drop-shadow-[0px_0px_120px_white]"
                    />
                </div>

                <!-- Título e descrição -->
                <div
                    class="text-center space-y-1 md:space-y-2 md:text-left md:w-full"
                >
                    <h1
                        class="text-2xl md:text-3xl font-bold text-white tracking-wide"
                    >
                        Acesse sua conta
                    </h1>
                    <p class="text-sm md:text-base text-white/70">
                        Bem-vindo de volta!
                    </p>
                </div>

                <!-- Formulário -->
                <ElForm
                    ref="formRef"
                    :model="formData"
                    :rules="formRules"
                    label-position="top"
                    class="!space-y-5 !w-full"
                >
                    <!-- Email -->
                    <ElFormItem prop="email" class="!mb-0">
                        <ElInput
                            v-model="formData.email"
                            placeholder="exemplo@network.com"
                            :prefix-icon="User"
                            size="large"
                            clearable
                            :disabled="
                                loginState.isLoading || loginState.isBlocked
                            "
                        />
                    </ElFormItem>

                    <!-- Senha -->
                    <ElFormItem prop="senha" class="!mb-0">
                        <ElInput
                            v-model="formData.senha"
                            placeholder="**********"
                            :prefix-icon="Lock"
                            type="password"
                            show-password
                            size="large"
                            :disabled="
                                loginState.isLoading || loginState.isBlocked
                            "
                        />
                    </ElFormItem>

                    <div class="space-y-2">
                        <!-- Lembrar-me e Esqueci minha senha -->
                        <div
                            class="flex items-center justify-between text-sm text-white/80"
                        >
                            <div class="flex items-center">
                                <ElCheckbox
                                    id="remember"
                                    type="primary"
                                    :disabled="
                                        loginState.isLoading ||
                                        loginState.isBlocked
                                    "
                                >
                                    Lembrar-me
                                </ElCheckbox>
                            </div>
                            <ElButton
                                link
                                type="primary"
                                size="small"
                                @click="sendResetPasswordEmail"
                                :class="
                                    !(
                                        loginState.isLoading ||
                                        loginState.isBlocked
                                    )
                                        ? 'hover:underline'
                                        : ''
                                "
                                :disabled="
                                    loginState.isLoading || loginState.isBlocked
                                "
                            >
                                Esqueceu a sua senha?
                            </ElButton>
                        </div>

                        <!-- Botão de login -->
                        <ElFormItem>
                            <ElButton
                                type="primary"
                                class="w-full !rounded-md md:!rounded-lg md:!h-11"
                                size="large"
                                :disabled="loginState.isBlocked"
                                :loading="loginState.isLoading"
                                @click="handleSubmit"
                            >
                                {{
                                    loginState.isBlocked
                                        ? `Aguarde ${loginState.timer}s`
                                        : "Entrar"
                                }}
                            </ElButton>
                            <span
                                v-if="loginState.isError"
                                class="absolute text-xs top-full text-red-400 mt-1 block text-center"
                            >
                                E-mail ou senha inválidos. Tente novamente.
                            </span>
                        </ElFormItem>
                    </div>
                </ElForm>

                <!-- Rodapé -->
                <div
                    class="text-center !mt-8 flex items-center justify-center w-full"
                >
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
        </div>
    </div>
</template>
