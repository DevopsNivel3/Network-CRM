import { LogAction, log } from "@/server/utils/log";

const ignoredRoutes = [
  "/api/presenca/heartbeat",
  "/api/presenca/iniciar",
  "/api/presenca/encerrar",
  "/api/auth/session",
  "/api/notificacoes/stream",
  "/api/notificacoes/unread",
  "/api/oportunidades/board/stream",
  "/api/whatsapp/stream",
];

const resourceLabels: Record<string, string> = {
  leads: "leads",
  oportunidades: "oportunidades",
  opportunitys: "oportunidades",
  visitas: "visitas",
  usuarios: "usuários",
  empresas: "empresas",
  financeiro: "registros financeiros",
  lembretes: "lembretes",
  notificacoes: "notificações",
  whatsapp: "WhatsApp",
  stats: "relatórios",
};

const singularResources: Record<string, string> = {
  leads: "lead",
  oportunidades: "oportunidade",
  opportunitys: "oportunidade",
  visitas: "visita",
  usuarios: "usuario",
};

const actionByMethod: Record<string, LogAction> = {
  GET: LogAction.VIEW,
  POST: LogAction.CREATE,
  PUT: LogAction.UPDATE,
  PATCH: LogAction.UPDATE,
  DELETE: LogAction.DELETE,
};

const verbByMethod: Record<string, string> = {
  GET: "Visualizou",
  POST: "Criou/registrou",
  PUT: "Atualizou",
  PATCH: "Atualizou",
  DELETE: "Excluiu",
};

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("afterResponse", async (_response, { event }) => {
    const path = getRequestURL(event).pathname;
    const auth = event.context.auth as { id?: number } | undefined;
    if (
      !path.startsWith("/api/") ||
      !auth?.id ||
      event.context.auditLogged ||
      ignoredRoutes.some((route) => path.startsWith(route))
    ) return;

    const method = event.method.toUpperCase();
    const action = actionByMethod[method];
    if (!action) return;

    const parts = path.split("/").filter(Boolean);
    const resourceKey = parts[1] || "sistema";
    const resourceLabel = resourceLabels[resourceKey] || resourceKey.replace(/-/g, " ");
    const id = parts.slice(2).find((part) => /^\d+$/.test(part));
    const singular = singularResources[resourceKey];
    const resource = singular || resourceKey;
    const activity = `${verbByMethod[method]} ${id && singular ? singular : resourceLabel}${id ? ` #${id}` : ""}`;
    const link = id && singular === "lead"
      ? `/crm/leads?id=${id}`
      : id && singular === "oportunidade"
        ? `/crm/oportunidades?id=${id}`
        : id && singular === "visita"
          ? `/crm/visitas?id=${id}`
          : id && singular === "usuario"
            ? `/admin/usuarios?id=${id}`
          : null;

    await log({
      event,
      action,
      message: JSON.stringify({
        atividade: activity,
        recurso: resource,
        registro_id: id ? Number(id) : null,
        rota: path,
        metodo: method,
        resultado: event.node.res.statusCode < 400 ? "Sucesso" : `Falha (${event.node.res.statusCode})`,
        link,
      }),
    });
  });
});
