import type { NuxtConfig } from "nuxt/schema";
import path from "path";

// Configuração do módulo FileStorage para salvar arquivos no backend
const uploadsDir = path.join(process.cwd(), "uploads");
const fileStorageConfig: NuxtConfig["fileStorage"] = {
  mount: uploadsDir,
};

export default fileStorageConfig;
