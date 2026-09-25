import type { NuxtConfig } from "nuxt/schema";

// Configuração do módulo TailwindCSS
const tailwindConfig: NuxtConfig["tailwindcss"] = {
  cssPath: "~/assets/css/main.css",
  config: {
    darkMode: "class",
    theme: {
      extend: {
        fontFamily: {
          sans: [
            "Inter",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "sans-serif",
          ],
        },
        colors: {
          "gray-blue": "#F0F2F5",
          charcoal: "#141414",
          ebano: "#111111",
          eerie: "#191919",
          nivel: "#79FE96",
        },
      },
    },
    content: [
      "./components/**/*.{vue,js,jsx,mjs,ts,tsx}",
      "./layouts/**/*.{vue,js,jsx,mjs,ts,tsx}",
      "./pages/**/*.{vue,js,jsx,mjs,ts,tsx}",
      "./{E,e}rror.{vue,js,jsx,mjs,ts,tsx}",
      "./{A,a}pp.{vue,js,jsx,mjs,ts,tsx}",
      "./app/spa-loading-template.html",
      "./composables/**/*.{js,ts,mjs}",
      "./plugins/**/*.{js,ts,mjs}",
      "./utils/**/*.{js,ts,mjs}",
      "./app.config.{js,ts,mjs}",
    ],
    plugins: [],
  },
  viewer: false,
};

export default tailwindConfig;
