import type { AuditLog } from "@prisma/client";

const operationLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  VIEW: "Visualização",
};

const fieldLabels: Record<string, string> = {
  id: "ID",
  lead_id: "Lead",
  oportunidade_id: "Oportunidade",
  visita_id: "Visita",
  usuario_id: "Usuário",
  empresa_id: "Empresa",
  board_id: "Quadro",
  nome: "Nome",
  nome_fantasia: "Nome fantasia",
  razao_social: "Razão social",
  email: "E-mail",
  contato: "Contato",
  telefone: "Telefone",
  status: "Status",
  titulo: "Título",
  descricao: "Descrição",
  observacao: "Observação",
  motivo: "Motivo",
  valor: "Valor",
  criado: "Criado em",
  atualizado: "Atualizado em",
  data: "Data",
  inicio: "Início",
  fim: "Fim",
  desativado: "Desativado",
  modulo: "Módulo",
  tipo: "Tipo",
};

const sensitiveField = /(^|_)(senha|password|token|secret|authorization|hash|codigo_sessao)($|_)/i;

const humanizeField = (field: string) =>
  fieldLabels[field] ||
  field
    .replace(/_id$/i, "")
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
      ? new Date(value)
      : null;
    if (date && !Number.isNaN(date.getTime())) return date.toLocaleString("pt-BR");
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  return String(value);
};

export interface AuditLogDetail {
  label: string;
  value: string;
}

const flattenDetails = (
  value: unknown,
  prefix = "",
  details: AuditLogDetail[] = [],
): AuditLogDetail[] => {
  if (details.length >= 60 || value === null || value === undefined) return details;

  if (Array.isArray(value)) {
    if (value.every((item) => ["string", "number", "boolean"].includes(typeof item))) {
      details.push({ label: prefix || "Itens", value: value.map(formatValue).join(", ") });
      return details;
    }
    value.slice(0, 10).forEach((item, index) =>
      flattenDetails(item, `${prefix || "Item"} ${index + 1}`, details),
    );
    return details;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (sensitiveField.test(key) || details.length >= 60) return;
      const label = prefix ? `${prefix} · ${humanizeField(key)}` : humanizeField(key);
      if (item !== null && typeof item === "object") flattenDetails(item, label, details);
      else details.push({ label, value: formatValue(item) });
    });
    return details;
  }

  details.push({ label: prefix || "Informação", value: formatValue(value) });
  return details;
};

const findNumericValue = (value: unknown, keys: string[]): number | null => {
  if (!value || typeof value !== "object") return null;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (keys.includes(key) && Number.isInteger(Number(item))) return Number(item);
  }
  return null;
};

const identifyEntity = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.recurso === "string" && record.recurso in entityLabel)
    return record.recurso;
  if ("oportunidade_id" in record || "board_id" in record) return "oportunidade";
  if ("lead_id" in record || "razao_social" in record || "nome_fantasia" in record)
    return "lead";
  if ("visita_id" in record || ("latitude" in record && "longitude" in record))
    return "visita";
  if ("permissoes" in record || ("email" in record && "cpf" in record)) return "usuario";
  return null;
};

const entityLabel: Record<string, string> = {
  lead: "lead",
  oportunidade: "oportunidade",
  visita: "visita",
  usuario: "usuário",
};

const buildLink = (payload: unknown, entity: string | null) => {
  if (payload && typeof payload === "object") {
    const explicitLink = (payload as Record<string, unknown>).link;
    if (typeof explicitLink === "string" && explicitLink.startsWith("/")) return explicitLink;
  }
  const opportunityId = findNumericValue(payload, ["oportunidade_id"]);
  if (opportunityId) return `/crm/oportunidades?id=${opportunityId}`;
  const leadId = findNumericValue(payload, ["lead_id"]);
  if (leadId) return `/crm/leads?id=${leadId}`;
  const visitId = findNumericValue(payload, ["visita_id"]);
  if (visitId) return `/crm/visitas?id=${visitId}`;

  const id = findNumericValue(payload, ["id"]);
  if (!id) return null;
  if (entity === "lead") return `/crm/leads?id=${id}`;
  if (entity === "oportunidade") return `/crm/oportunidades?id=${id}`;
  if (entity === "visita") return `/crm/visitas?id=${id}`;
  if (entity === "usuario") return `/admin/usuarios?id=${id}`;
  return null;
};

const parseUserAgent = (agent: string) => {
  const browser = agent.includes("Edg/")
    ? "Microsoft Edge"
    : agent.includes("Firefox/")
      ? "Mozilla Firefox"
      : agent.includes("Chrome/")
        ? "Google Chrome"
        : agent.includes("Safari/")
          ? "Safari"
          : "Navegador não identificado";
  const device = /Mobile|Android|iPhone|iPad/i.test(agent) ? "Dispositivo móvel" : "Computador";
  return { browser, device };
};

export const presentAuditLog = (
  log: Pick<AuditLog, "id" | "operacao" | "descricao" | "ip" | "agent" | "criado">,
) => {
  const rawDescription = log.descricao?.trim() || "Atividade sem descrição";
  let payload: unknown = null;
  try {
    payload = JSON.parse(rawDescription);
  } catch {
    payload = null;
  }

  const lowerDescription = rawDescription.toLowerCase();
  const isLogin = lowerDescription.includes("login realizado");
  const isLogout = lowerDescription.includes("logout realizado");
  const entity = identifyEntity(payload);
  const operationLabel = operationLabels[log.operacao] || log.operacao;
  const actionTitle = isLogin
    ? "Login no sistema"
    : isLogout
      ? "Logout do sistema"
      : payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).atividade === "string"
        ? String((payload as Record<string, unknown>).atividade)
        : `${operationLabel}${entity ? ` de ${entityLabel[entity]}` : ""}`;
  const details = payload ? flattenDetails(payload) : [];
  const { browser, device } = parseUserAgent(log.agent);

  return {
    id: log.id,
    operacao: log.operacao,
    operacaoLabel: isLogin ? "Login" : isLogout ? "Logout" : operationLabel,
    titulo: actionTitle,
    resumo: payload
      ? details.slice(0, 3).map((item) => `${item.label}: ${item.value}`).join(" · ") || actionTitle
      : rawDescription,
    detalhes: details,
    link: buildLink(payload, entity),
    ip: log.ip,
    navegador: browser,
    dispositivo: device,
    criado: log.criado,
  };
};
