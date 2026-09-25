import type { NuxtConfig } from "nuxt/schema";

// Configuração nodemailer, usado para enviar emails
// Limites diários de envio
// Gmail pessoal - Até 500 destinatários por período contínuo de 24 horas.
// Google Workspace - Até 2.000 destinatários por período contínuo de 24 horas.
const nodemailerConfig: NuxtConfig["nodemailer"] = {
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_EMAIL_USER,
    pass: process.env.GOOGLE_EMAIL_PASSWORD,
  },
};

export default nodemailerConfig;
