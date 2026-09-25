import prisma from "@/lib/prisma";
import { EvolutionApiService } from "@/server/utils/evolutionAPI";

export default defineEventHandler(async (event) => {
  try {
    if (
      !hasUserPermission(event.context.auth.permissoes, UserPermissions.ADMIN)
    )
      throw new Error("Você não tem permissão suficiente");

    const empresaId = event.context.auth.empresa_id;
    const integracao = await prisma.integracao.findFirst({
      where: { empresa_id: empresaId, tipo: "whatsapp" },
    });
    if (!integracao || !integracao.enabled)
      throw new Error("WhatsApp não configurado para esta empresa");
    const config =
      (
        integracao as {
          config?: {
            instance_id?: string | null;
            instance_name?: string | null;
            qrcode_base64?: string | null;
            webhook_url?: string | null;
          };
        }
      ).config || {};

    const instanceName = config.instance_name || config.instance_id;
    if (!instanceName) throw new Error("Instância do WhatsApp não configurada");
    const api = new EvolutionApiService(instanceName);

    let res: any = null;
    let qrcode: any = null;
    let connectionState: any = null;
    let message: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        res = await api.connectInstance();
        console.log("Evolution connectInstance response:", res);
      } catch (err) {
        lastError = err;
        console.error("Evolution connectInstance error:", err);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      qrcode =
        res?.base64 ||
        res?.data?.base64 ||
        res?.code ||
        res?.pairingCode ||
        res?.qrcode?.base64 ||
        res?.qrCode?.base64 ||
        res?.data?.qrcode?.base64 ||
        res?.data?.qrCode?.base64 ||
        res?.qrcode?.code ||
        res?.qrCode?.code ||
        res?.data?.qrcode?.code ||
        res?.data?.qrCode?.code ||
        (typeof res?.qrcode === "string" ? res.qrcode : null) ||
        null;
      const pairingCode =
        res?.pairingCode ||
        res?.qrcode?.pairingCode ||
        res?.data?.qrcode?.pairingCode ||
        null;
      message = res?.message || null;

      try {
        const state = await api.getInstanceStatus();
        connectionState =
          state?.instance?.state || (state as any)?.status || (state as any)?.state || null;
      } catch (err) {
        lastError = err;
        console.error("Evolution getInstanceStatus error:", err);
      }

      if (qrcode || pairingCode) break;
      if (connectionState && String(connectionState).toLowerCase() === "open") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    if (qrcode) {
      const currentConfig =
        (integracao as { config?: Record<string, any> | null }).config || {};
      await prisma.integracao.update({
        where: { id: integracao.id },
        data: {
          config: {
            ...currentConfig,
            qrcode_base64: qrcode,
            qrcode_updated_at: new Date().toISOString(),
          },
        },
      });
    }

    const fallbackQr = config?.qrcode_base64 || null;

    return {
      status: connectionState,
      qrcode: qrcode || fallbackQr,
      message: message || lastError?.message || null,
    };
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao buscar QR code do WhatsApp",
    });
  }
});
