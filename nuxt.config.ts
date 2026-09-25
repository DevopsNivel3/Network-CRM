import fileStorageConfig from "./config/filestorage.config";
import nodemailerConfig from "./config/nodemailer.config";
import colorModeConfig from "./config/colormode.config";
import tailwindConfig from "./config/tailwind.config";
import sidebaseAuthConfig from "./config/auth.config";
import securityConfig from "./config/security.config";
import echartsConfig from "./config/echarts.config";
import elementConfig from "./config/element.config";
import nitroConfig from "./config/nitro.config";
import dayjsConfig from "./config/dayjs.config";
import headConfig from "./config/head.config";

// Configuração do Nuxt
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  buildDir: process.env.NUXT_BUILD_DIR || ".nuxt",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  modules: [
    "@sidebase/nuxt-auth",
    "@nuxtjs/tailwindcss",
    "@element-plus/nuxt",
    "@nuxtjs/color-mode",
    "nuxt-file-storage",
    "@nuxtjs/leaflet",
    "nuxt-nodemailer",
    "@nuxtjs/device",
    "nuxt-security",
    "nuxt-echarts",
    "@nuxt/image",
    "@pinia/nuxt",
    "nuxt-swiper",
    "dayjs-nuxt",
  ],
  app: {
    rootAttrs: {
      id: "network-app",
    },
    head: headConfig,
  },
  routeRules: {
    "/home": { redirect: { to: "/crm", statusCode: 301 } },
    "/leads": { redirect: { to: "/crm/leads", statusCode: 301 } },
    "/opportunity": {
      redirect: { to: "/crm/oportunidades", statusCode: 301 },
    },
    "/visits": { redirect: { to: "/crm/visitas", statusCode: 301 } },
    "/users": { redirect: { to: "/admin/usuarios", statusCode: 301 } },
    "/manager/empresas": {
      redirect: { to: "/dev/empresas", statusCode: 301 },
    },
    "/api/auth/login": {
      csurf: false,
    },
    "/api/auth/logout": {
      csurf: false,
    },
    "/api/mobile/**": {
      csurf: false,
    },
    "/api/whatsapp/webhook": {
      csurf: false,
    },
    "/api/whatsapp/check": {
      csurf: false,
    },
    "/api/whatsapp/send": {
      csurf: false,
    },
    "/api/leads/:id/comment": {
      security: {
        xssValidator: false,
      },
    },
    "/api/oportunidades/:id/comment": {
      security: {
        xssValidator: false,
      },
    },
    "/api/oportunidades/:id/interacoes": {
      security: {
        xssValidator: false,
      },
    },
  },
  runtimeConfig: {
    PUSH_VAPID_PRIVATE_KEY: process.env.PUSH_VAPID_PRIVATE_KEY || "",
    PUSH_VAPID_SUBJECT:
      process.env.PUSH_VAPID_SUBJECT || "mailto:suporte@localhost.local",
    public: {
      PROJECT_VERSION: process.env.APP_VERSION || "2.4.4",
      APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:3000",
      EVOLUTION_ENABLED: !!(
        process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_TOKEN
      ),
      PUSH_VAPID_PUBLIC_KEY:
        process.env.NUXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY || "",
    },
  },
  fileStorage: fileStorageConfig,
  nodemailer: nodemailerConfig,
  tailwindcss: tailwindConfig,
  elementPlus: elementConfig,
  colorMode: colorModeConfig,
  security: securityConfig,
  auth: sidebaseAuthConfig,
  echarts: echartsConfig,
  dayjs: dayjsConfig,
  nitro: nitroConfig,
  image: process.platform === "win32" ? { provider: "none" } : undefined,
  vite: {
    resolve: {
      preserveSymlinks: true,
      alias: {
        ".prisma/client/index-browser":
          "./node_modules/.prisma/client/index-browser.js",
      },
    },
  },
});
