import type { NuxtConfig } from "nuxt/schema";

// Configuração do módulo de Tema (Escuro/Claro)
const colorModeConfig: NuxtConfig["colorMode"] = {
  preference: "light",
  fallback: "light",
  classPrefix: "",
  classSuffix: "",
  storage: "cookie",
  disableTransition: true,
};

export default colorModeConfig;
