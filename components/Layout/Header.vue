<script setup lang="ts">
import {
    SwitchButton,
    Lock,
    Avatar,
    UserFilled,
    ArrowRightBold,
    Bell,
} from "@element-plus/icons-vue";

const { user, logout } = useAuthSession();
const { isDark } = useTheme();
const menu = useMenu();
const notifications = useNotifications();
const isChangePasswordOpen = ref(false);
const isProfileOpen = ref(false);
const isNotificationsOpen = ref(false);

// Abre o modal de alteração de senha
const openChangePassword = () => (isChangePasswordOpen.value = true);

// Abre o modal de perfil do usuário
const openProfileMenu = () => (isProfileOpen.value = true);

const openNotifications = () => (isNotificationsOpen.value = true);

// Abre o drawer/sidebar menu
const toggleSidebarMenu = () => menu.toggleMenu("sidebar");

// Abre o menu mobile
const openMobileMenu = () => menu.openMenu("mobile");
</script>

<template>
    <ElMenu
        class="!border-none flex items-center justify-between"
        popper-class="bg-indigo-100 dark:bg-ebano"
        :close-on-click-outside="true"
        menu-trigger="click"
        mode="horizontal"
        :ellipsis="false"
    >
        <!-- Logo do sistema -->
        <ElMenuItem
            disabled
            class="md:!hidden !pl-8 md:!pl-2 !opacity-100 !flex !items-center !justify-center"
        >
            <NuxtLink to="/inicio" class="items-center justify-center flex">
                <NuxtImg
                    class="!min-w-fit pl-1 !h-6 !drop-shadow-[0_0_0.5px_black] dark:!drop-shadow-[0_0_0.5px_white]"
                    :src="
                        isDark
                            ? '/img/network-s-dark.webp'
                            : '/img/network-s-light.webp'
                    "
                    v-if="menu.state.sidebar"
                />
            </NuxtLink>
        </ElMenuItem>
        <div class="absolute -bottom-4 -left-3 z-10">
            <ElButton
                @click="toggleSidebarMenu"
                class="!hidden md:!flex !px-2 !bg-neutral-50 dark:!bg-eerie !py-0 !rounded-full"
                :class="menu.state.sidebar ? '!text-nivel !border-nivel' : ''"
            >
                <ElIcon
                    class="transition-transform duration-300 ease-in-out"
                    :class="{ 'rotate-180': menu.state.sidebar }"
                    size="small"
                >
                    <ArrowRightBold />
                </ElIcon>
            </ElButton>
        </div>
        <div class="flex items-center gap-2 justify-end w-full">
            <!-- Botão de troca do tema -->
            <div class="hidden md:flex">
                <LayoutSwitchTheme />
            </div>
            <ElBadge
                :value="notifications.unreadCount"
                :hidden="notifications.unreadCount === 0"
                :max="99"
            >
                <ElButton @click="openNotifications">
                    <ElIcon>
                        <Bell />
                    </ElIcon>
                </ElButton>
            </ElBadge>
            <!-- Botão para abrir o menu mobile -->
            <ElMenuItem
                @click="openMobileMenu"
                class="!flex !items-center !justify-center md:!hidden"
            >
                <div
                    class="flex items-center justify-center uppercase text-xs tracking-wider font-semibold"
                >
                    <ElIcon size="13">
                        <ArrowRightBold />
                    </ElIcon>
                    Menu
                </div>
            </ElMenuItem>
            <!-- Menu do usuário -->
            <ElSubMenu index="0" class="!hidden md:!flex">
                <template #title>
                    <ElIcon class="!m-0 !p-0">
                        <Avatar />
                    </ElIcon>
                </template>
                <h3
                    class="truncate w-fit px-3 py-1 text-black/80 dark:text-white/80"
                >
                    {{ user.nome }}
                </h3>
                <ElMenuItem @click="openProfileMenu">
                    <ElIcon>
                        <UserFilled />
                    </ElIcon>
                    Meu Perfil
                </ElMenuItem>
                <ElMenuItem @click="openChangePassword">
                    <ElIcon>
                        <Lock />
                    </ElIcon>
                    Alterar senha
                </ElMenuItem>
                <ElMenuItem class="!bg-red-500 !text-white" @click="logout">
                    <ElIcon>
                        <SwitchButton />
                    </ElIcon>
                    Deslogar
                </ElMenuItem>
            </ElSubMenu>
        </div>
    </ElMenu>
    <!-- Modal de Alteração de Senha -->
    <LayoutPerfilPasswordModal v-model="isChangePasswordOpen" />
    <!-- Modal de Perfil do Usuário -->
    <LayoutPerfilInfoModal v-model="isProfileOpen" />
    <!-- Central de notificações -->
    <LayoutNotificationsCenter v-model="isNotificationsOpen" />
    <!-- Menu Mobile -->
    <LayoutMobileMenu />
</template>
