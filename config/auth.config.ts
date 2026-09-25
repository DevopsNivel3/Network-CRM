import type { NuxtConfig } from "nuxt/schema";

// Configuração do módulo de Autênticação
const sidebaseAuthConfig: NuxtConfig["auth"] = {
  globalAppMiddleware: {
    isEnabled: true,
    allow404WithoutAuth: false,
    addDefaultCallbackUrl: "/",
  },
  baseURL: "/api/auth",
  provider: {
    type: "local",
    endpoints: {
      signIn: { path: "/login", method: "post" },
      signUp: undefined,
      signOut: { path: "/logout", method: "post" },
      getSession: { path: "/session", method: "get" },
    },
    session: {
      dataType: {
        user: {
          id: "number",
          nome: "string",
          permissoes: "number",
          empresa_nome: "string",
          empresa_modulos: "string[]",
          avatar: "string",
        },
      },
    },
    pages: {
      login: "/",
    },
    token: {
      signInResponseTokenPointer: "/token",
      maxAgeInSeconds: 60 * 60 * 12, // 12 horas
      secureCookieAttribute: process.env.NODE_ENV === "production",
      sameSiteAttribute: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  },
  sessionRefresh: {
    enablePeriodically: 30000,
    enableOnWindowFocus: true,
  },
};

export default sidebaseAuthConfig;
