import type { NuxtConfig } from "nuxt/schema";

/*
Configuração do módulo data/hora usando Dayjs
- Uso o módulo para não causar erro de hydration entre servidor/cliente
*/
const dayjsConfig: NuxtConfig["dayjs"] = {
  locales: ["pt-br"],
  plugins: ["timezone"],
  defaultLocale: "pt-br",
  defaultTimezone: "America/Sao_Paulo",
};

export default dayjsConfig;
