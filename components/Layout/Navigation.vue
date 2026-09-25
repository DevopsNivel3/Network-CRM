<script setup lang="ts">
import {
    Tools,
    ArrowLeftBold,
    SwitchButton,
    Lock,
    UserFilled,
    ArrowDownBold,
    Menu,
    Briefcase,
    Platform,
    Wallet,
    Search,
} from "@element-plus/icons-vue";

const { user, logout, isAuthenticated } = useAuthSession();
const nuxtConfig = useRuntimeConfig();
const { isDark } = useTheme();
const route = useRoute();
const menu = useMenu();
const isChangePasswordOpen = ref(false);
const isProfileOpen = ref(false);

// Fecha o menu lateral no mobile
const closeMobileMenu = () => menu.closeMenu("mobile");

// Abre o modal de perfil do usuário
const openProfileMenu = () => (isProfileOpen.value = true);

// Abre o modal de alterar senha
const openChangePassword = () => (isChangePasswordOpen.value = true);

// Pega o pathname da rota ativa
const activePath = computed(() => route.path);

interface MenuItem {
    title: string;
    beta?: boolean;
    icon: Component;
    type?: "link" | "submenu";
    href?: string;
    hasPermission?: boolean;
    groups?: {
        title?: string;
        items: {
            label: string;
            hasPermission?: boolean;
            href: string;
        }[];
    }[];
    items?: {
        label: string;
        hasPermission?: boolean;
        href: string;
    }[];
}

type ModuleKey = Module;

const hasModuleEnabled = (moduleKey: ModuleKey) => {
    const enabledModules = normalizePermissionModules(
        user.empresa_modulos,
    );
    return enabledModules.includes(moduleKey);
};

const hasModulePermission = (moduleKey: ModuleKey) =>
    permissionModules[moduleKey]
        .filter((key) => key.startsWith("VER_"))
        .some((key) =>
            hasUserPermission(
                user.permissoes,
                UserPermissions[key as keyof typeof UserPermissions],
            ),
        );

const adminItems = [
    {
        label: "Usuários",
        href: "/admin/usuarios",
        permission: UserPermissions.VER_USUARIO,
    },
];

const hasAdminSectionPermission = () =>
    adminItems.some((item) =>
        hasUserPermission(user.permissoes, item.permission),
    ) || hasUserPermission(user.permissoes, UserPermissions.GRANT_ADMIN);

// Verifica se o usuário tem permissão para acessar a rota e lista as rotas
const menuItems: MenuItem[] = [
    {
        title: "Início",
        icon: Menu,
        type: "link",
        href: "/inicio",
    },
    {
        title: Modules.CRM,
        icon: Briefcase,
        items: [
            {
                label: "Dashboard",
                href: "/crm",
            },
            {
                label: "Leads",
                href: "/crm/leads",
                hasPermission: hasUserPermission(
                    user.permissoes,
                    UserPermissions.VER_LEAD,
                ),
            },
            {
                label: "Oportunidades",
                href: "/crm/oportunidades",
                hasPermission: hasUserPermission(
                    user.permissoes,
                    UserPermissions.VER_OPORTUNIDADE,
                ),
            },
            {
                label: "Visitas",
                href: "/crm/visitas",
                hasPermission: hasUserPermission(
                    user.permissoes,
                    UserPermissions.VER_VISITA,
                ),
            },
            {
                label: "Grupos",
                href: "/crm/grupos",
                hasPermission: hasUserPermission(
                    user.permissoes,
                    UserPermissions.VER_GRUPO,
                ),
            },
        ],
        hasPermission: hasModuleEnabled("CRM") && hasModulePermission("CRM"),
    },
    {
        title: "Financeiro",
        icon: Wallet,
        type: "link",
        href: "/financeiro",
        hasPermission:
            hasModuleEnabled("FINANCEIRO") && hasModulePermission("FINANCEIRO"),
    },
    {
        title: "Buscar Oportunidades",
        beta: true,
        icon: Search,
        type: "link",
        href: "/localizeia",
        hasPermission:
            hasModuleEnabled("LOCALIZEIA") && hasModulePermission("LOCALIZEIA"),
    },
    {
        title: "Administração",
        icon: Tools,
        items: adminItems.map((item) => ({
            label: item.label,
            href: item.href,
            hasPermission:
                hasUserPermission(user.permissoes, item.permission) ||
                hasUserPermission(user.permissoes, UserPermissions.ADMIN) ||
                hasUserPermission(user.permissoes, UserPermissions.GRANT_ADMIN),
        })),
        hasPermission: hasAdminSectionPermission(),
    },
    {
        title: "Empresas",
        icon: Platform,
        type: "link",
        href: "/dev/empresas",
        hasPermission: hasUserPermission(
            user.permissoes,
            UserPermissions.GRANT_ADMIN,
        ),
    },
];

// Verifica se o usuário possui submenus com permissões diferentes para cada grupo de itens
const hasAnyPermission = (menuItem: MenuItem): boolean => {
    const isAllowed = (value?: boolean) => value !== false;
    if (!isAllowed(menuItem.hasPermission)) return false;
    if (menuItem.items)
        return menuItem.items.some((item) => isAllowed(item.hasPermission));
    if (menuItem.groups)
        return menuItem.groups.some((group) =>
            group.items.some((item) => isAllowed(item.hasPermission)),
        );
    return isAllowed(menuItem.hasPermission);
};
</script>

<template>
    <NuxtLink
        to="/inicio"
        class="items-center justify-start md:pl-6 pt-3 hidden md:flex gap-1"
    >
        <!-- Logo longa do sistema -->
        <NuxtImg
            v-if="menu.state.sidebar"
            :src="
                isDark
                    ? '/img/network-s-dark.webp'
                    : '/img/network-s-light.webp'
            "
            class="!min-w-fit !h-6 !drop-shadow-[0_0_0.2px_black] dark:!drop-shadow-[0_0_0.5px_white]"
        />
        <!-- Logo curta do sistema -->
        <NuxtImg
            v-if="!menu.state.sidebar"
            class="!w-6 !h-6 !drop-shadow-[0_0_0.2px_black] dark:!drop-shadow-[0_0_0.5px_white]"
            src="/icon/favicon-96x96.png"
        />
    </NuxtLink>
    <div
        class="!border-y dark:!border-white/15 flex items-center justify-between py-2.5 md:pb-4 md:pt-3 pl-2 pr-4 md:px-4 md:mt-4"
    >
        <div class="flex items-center gap-4 h-10 md:h-auto w-full">
            <!-- User Profile Desktop -->
            <div
                v-if="$device.isDesktopOrTablet"
                class="hidden md:flex items-center h-full justify-center gap-2"
            >
                <ElSkeleton
                    class="hidden md:flex items-center h-full justify-center gap-2"
                    :loading="!isAuthenticated"
                    animated
                >
                    <template #template>
                        <ElSkeletonItem variant="circle" class="!h-10 !w-10" />
                        <div
                            class="flex flex-col gap-1.5"
                            v-if="menu.state.sidebar"
                        >
                            <ElSkeletonItem variant="text" class="!w-16 !h-4" />
                            <ElSkeletonItem variant="text" class="!w-24 !h-3" />
                        </div>
                    </template>
                    <template #default>
                        <ElAvatar
                            class="!hidden md:!flex !text-black dark:!text-white !font-semibold"
                            :src="user?.avatar"
                        >
                            <span
                                v-if="user?.nome"
                                class="font-medium uppercase"
                            >
                                {{ user.nome.slice(0, 1) }}
                            </span>
                        </ElAvatar>
                        <div
                            class="flex flex-col justify-center h-full !max-w-[200px] md:!max-w-[120px]"
                            v-if="menu.state.sidebar"
                        >
                            <h3
                                class="text-black dark:text-white font-medium truncate"
                            >
                                {{ user.nome }}
                            </h3>
                            <p
                                class="text-xs text-black/80 truncate dark:text-white/80"
                            >
                                {{ user.empresa_nome }}
                            </p>
                        </div>
                    </template>
                </ElSkeleton>
            </div>
            <ElDropdown
                v-if="$device.isMobile"
                trigger="click"
                class="!flex items-center justify-center md:!hidden"
            >
                <!-- User Profile Mobile -->
                <div class="flex items-center justify-center gap-2">
                    <ElAvatar
                        class="!flex !font-semibold !text-black dark:!text-white"
                        :src="user?.avatar"
                    >
                        <span class="font-medium text-xs uppercase">
                            {{ user.nome.slice(0, 1) }}
                        </span>
                    </ElAvatar>
                    <div
                        class="flex flex-col h-full !max-w-[100px]"
                        v-if="menu.state.sidebar"
                    >
                        <h3
                            class="text-black dark:text-white font-medium truncate"
                        >
                            {{ user.nome }}
                        </h3>
                        <p
                            class="text-xs text-black/80 truncate dark:text-white/80"
                        >
                            {{ user.empresa_nome }}
                        </p>
                    </div>
                    <ElIcon size="10">
                        <ArrowDownBold />
                    </ElIcon>
                </div>
                <template #dropdown>
                    <ElDropdownMenu>
                        <ElDropdownItem @click="openProfileMenu">
                            <ElIcon>
                                <UserFilled />
                            </ElIcon>
                            Meu Perfil
                        </ElDropdownItem>
                        <ElDropdownItem @click="openChangePassword">
                            <ElIcon>
                                <Lock />
                            </ElIcon>
                            Alterar senha
                        </ElDropdownItem>
                        <ElDropdownItem
                            class="!bg-red-500 !text-white"
                            @click="logout"
                        >
                            <ElIcon>
                                <SwitchButton />
                            </ElIcon>
                            Deslogar
                        </ElDropdownItem>
                    </ElDropdownMenu>
                </template>
            </ElDropdown>
            <div class="h-full w-[0.5px] bg-black/20 dark:bg-white/20" />
            <!-- Mudar de tema -->
            <span class="flex md:hidden">
                <LayoutSwitchTheme />
            </span>
        </div>
        <!-- Fecha o menu mobile -->
        <div
            class="flex items-center gap-2 md:hidden uppercase text-xs tracking-wider font-semibold"
            @click="closeMobileMenu"
        >
            <ElIcon>
                <ArrowLeftBold />
            </ElIcon>
            Fechar
        </div>
    </div>
    <!-- Menu lateral -->
    <ElScrollbar view-class="!h-full">
        <ElMenu
            :default-openeds="menuItems.map((_, index) => index.toString())"
            :collapse="!menu.state.sidebar && !menu.state.mobile"
            :collapse-transition="false"
            :default-active="activePath"
            class="!border-none !w-full"
            :router="true"
        >
            <template v-for="(menuItem, index) in menuItems" :key="index">
                <template v-if="hasAnyPermission(menuItem)">
                    <ElMenuItem
                        v-if="menuItem.type === 'link'"
                        :index="menuItem.href"
                    >
                        <ElIcon class="!ml-0.5">
                            <component :is="menuItem.icon" />
                        </ElIcon>
                        <template #title>
                            <div class="flex flex-col leading-tight py-0.5">
                                <span class="font-medium">
                                    {{ menuItem.title }}
                                </span>
                                <span
                                    v-if="menuItem.beta"
                                    class="text-[10px] font-medium text-emerald-600 dark:text-emerald-300"
                                >
                                    Ferramenta em beta
                                </span>
                            </div>
                        </template>
                    </ElMenuItem>
                    <ElSubMenu v-else :index="index.toString()">
                        <template #title>
                            <ElIcon class="!ml-0.5">
                                <component :is="menuItem.icon" />
                            </ElIcon>
                            <span class="font-medium">
                                {{ menuItem.title }}
                            </span>
                        </template>
                        <template v-if="menuItem.groups">
                            <ElMenuItemGroup
                                v-for="(group, groupIndex) in menuItem.groups"
                                :key="groupIndex"
                                :title="group.title"
                            >
                                <template #title v-if="group.title">
                                    {{ group.title }}
                                </template>
                                <ElMenuItem
                                    v-for="(item, itemIndex) in group.items"
                                    :key="itemIndex"
                                    :index="item.href"
                                    v-show="item.hasPermission !== false"
                                >
                                    {{ item.label }}
                                </ElMenuItem>
                            </ElMenuItemGroup>
                        </template>
                        <template v-else-if="menuItem.items">
                            <ElMenuItem
                                v-for="(item, itemIndex) in menuItem.items"
                                :key="itemIndex"
                                :index="item.href"
                                v-show="item.hasPermission !== false"
                            >
                                {{ item.label }}
                            </ElMenuItem>
                        </template>
                    </ElSubMenu>
                </template>
            </template>
        </ElMenu>
    </ElScrollbar>
    <!-- Logo da Nível 3 TI -->
    <div
        class="flex justify-between items-center text-ellipsis text-nowrap truncate gap-1 px-4 pt-5 pb-5 md:pb-4 !border-t dark:!border-white/20"
    >
        <div class="!min-w-10">
            <NuxtLink
                class="hover:opacity-60 transition-opacity"
                href="https://www.nivel3ti.com.br"
                target="_blank"
            >
                <NuxtImg
                    class="h-4 md:h-3.5 drop-shadow-[0px_0px_1px_black]"
                    src="/img/nivel3ti-logo.webp"
                    alt="Logo Nível 3 TI"
                />
            </NuxtLink>
        </div>
        <div
            class="font-semibold text-xs text-black/60 dark:text-white/80"
            v-if="menu.state.sidebar"
        >
            v{{ nuxtConfig.public.PROJECT_VERSION }}
        </div>
    </div>
    <LayoutPerfilPasswordModal v-model="isChangePasswordOpen" />
    <LayoutPerfilInfoModal v-model="isProfileOpen" />
</template>

<style>
.el-drawer__body {
    padding: 0 !important;
}
</style>
