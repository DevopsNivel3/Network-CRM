import type { NuxtAppConfig } from "nuxt/schema";

// ConfiguraÃ§Ã£o do Head
const headConfig: NuxtAppConfig["head"] = {
  title: "N3TWORK",
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [
    { rel: "icon", href: "/icon/favicon.ico" },
    { rel: "shortcut icon", href: "/icon/favicon.ico" },
    { rel: "apple-touch-icon", href: "/icon/apple-touch-icon.ico" },
    { rel: "manifest", href: "/icon/site.webmanifest" },
  ],
};

export default headConfig;

