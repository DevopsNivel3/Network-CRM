import type { NuxtConfig } from "nuxt/schema";

// Configuração do Nitro, usado para criar uma storage na memória
const nitroConfig: NuxtConfig["nitro"] = {
  // Permite validar um novo build sem interromper a instância que usa `.output`.
  output: {
    dir: process.env.NETWORK_NITRO_OUTPUT_DIR || ".output",
  },
  storage: {
    loginlimit: {
      driver: "memory",
    },
  },
  experimental: {
    wasm: true,
  },
  rollupConfig: {
    external: ["xlsx", "json2csv", "exceljs"],
  },
  // Configurações para aumentar o limite de payload
  routeRules: {
    "/api/**": {
      cors: true,
    },
  },
};

export default nitroConfig;
