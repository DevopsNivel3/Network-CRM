import type { NuxtConfig } from "nuxt/schema";

/*
Configuração do módulo Securiry, usado para facilitar a configuração dos headers e das requisições

As regras abaixo, são usadas para criar o frame no projeto do APK, por favor não alterar.
- csrf.cookie: { sameSite: "none" }
- headers.crossOriginEmbedderPolicy: false
- headers.contentSecurityPolicy["frame-ancestors"]: ["*"]
*/
const securityConfig: NuxtConfig["security"] = {
  csrf: {
    enabled: true,
    https: true,
    cookieKey: "csrf",
    cookie: {
      sameSite: "none",
    },
  },
  rateLimiter: false,
  requestSizeLimiter: {
    maxRequestSizeInBytes: 50000000, // 50MB
    maxUploadFileRequestInBytes: 50000000, // 50MB
  },
  headers: {
    crossOriginEmbedderPolicy: false,
    xXSSProtection: "1; mode=block",
    contentSecurityPolicy: {
      "img-src": ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      "object-src": ["'self'", "blob:"],
      "frame-ancestors": ["*"],
    },
    permissionsPolicy: {
      geolocation: ["self"],
      camera: ["self"],
    },
    xFrameOptions: false,
  },
};

export default securityConfig;
