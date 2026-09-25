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
          };
        }
      ).config || {};

    const instanceName = config.instance_name || config.instance_id;
    if (!instanceName) throw new Error("Instância do WhatsApp não configurada");
    const api = new EvolutionApiService(instanceName);

    const res = await api.logout();

    return res;
  } catch (err: any) {
    console.error(err);
    throw createError({
      statusCode: 400,
      message: err?.message || "Erro ao desconectar instância",
    });
  }
});
