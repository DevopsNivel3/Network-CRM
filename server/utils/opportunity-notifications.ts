import type { PrismaClient } from "@prisma/client";
import {
  hasActiveNotificationStream,
  publishNotificationStream,
} from "@/server/utils/notificationStream";
import { sendPushNotificationToUser } from "@/server/utils/web-push";

type PrismaLikeClient = PrismaClient | any;

type CreateNotificationInput = {
  empresaId?: number | null;
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
  payload?: Record<string, any>;
};

type AssignmentSource = "board" | "manual";

const getTipoInteracao = (tipo: number) => {
  const tipos: Record<number, string> = {
    1: "Mensagem",
    2: "E-mail",
    3: "Telefone",
  };

  return tipos[tipo] || `Tipo ${tipo}`;
};

const getStatusInteracao = (tipo: number, status: number) => {
  const statusPorTipo: Record<number, Record<number, string>> = {
    1: { 1: "Enviada", 2: "Respondida", 3: "Ignorada" },
    2: { 4: "Enviado", 5: "Respondido", 6: "Nao respondido" },
    3: { 7: "Atendida", 8: "Nao atendida", 9: "Ocupado" },
  };

  return statusPorTipo[tipo]?.[status] || `Status ${status}`;
};

const createAndPublishNotification = async (
  client: PrismaLikeClient,
  input: CreateNotificationInput,
) => {
  const notificacao = await client.notificacaoUsuario.create({
    data: {
      empresa_id: input.empresaId ?? null,
      usuario_id: input.usuarioId,
      tipo: input.tipo,
      titulo: input.titulo,
      mensagem: input.mensagem,
      link: input.link ?? null,
      payload: input.payload ?? null,
    },
    select: {
      id: true,
      tipo: true,
      titulo: true,
      mensagem: true,
      link: true,
      payload: true,
      entregue_em: true,
      criado: true,
    },
  });

  const serializedNotification = {
    ...notificacao,
    criado: notificacao.criado.toISOString(),
    entregue_em: notificacao.entregue_em?.toISOString() || null,
  };

  if (hasActiveNotificationStream(input.usuarioId)) {
    publishNotificationStream(input.usuarioId, {
      type: "notification",
      notification: serializedNotification,
    });
  } else {
    const delivered = await sendPushNotificationToUser(client, input.usuarioId, {
      id: notificacao.id,
      tipo: notificacao.tipo,
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      link: notificacao.link,
      payload: notificacao.payload as Record<string, any> | null,
      criado: notificacao.criado.toISOString(),
    });

    if (delivered && !notificacao.entregue_em) {
      await client.notificacaoUsuario.update({
        where: { id: notificacao.id },
        data: {
          entregue_em: new Date(),
        },
      });
    }
  }

  return notificacao;
};

export async function notifyOpportunityInteraction(
  client: PrismaLikeClient,
  params: {
    oportunidadeId: number;
    actorUserId: number;
    tipo: number;
    status: number;
    conteudo?: string | null;
  },
) {
  const oportunidade = await client.oportunidade.findUnique({
    where: { id: params.oportunidadeId },
    select: {
      id: true,
      lead_id: true,
      lead: {
        select: {
          nome_lead: true,
          contato_nome: true,
          empresa_id: true,
        },
      },
      board: {
        select: {
          titulo: true,
        },
      },
      responsaveis: {
        select: {
          usuario_id: true,
        },
      },
    },
  });

  if (!oportunidade) return [];

  const actor = await client.usuario.findUnique({
    where: { id: params.actorUserId },
    select: {
      id: true,
      nome: true,
    },
  });

  const destinatarios = [
    ...new Set(
      oportunidade.responsaveis
        .map((responsavel: { usuario_id: number }) => responsavel.usuario_id)
        .filter((usuarioId: number) => usuarioId !== params.actorUserId),
    ),
  ];

  if (!destinatarios.length) return [];

  const tipoLabel = getTipoInteracao(params.tipo);
  const statusLabel = getStatusInteracao(params.tipo, params.status);
  const leadNome =
    oportunidade.lead.nome_lead ||
    oportunidade.lead.contato_nome ||
    `Oportunidade #${oportunidade.id}`;
  const boardLabel = oportunidade.board?.titulo || "Sem status";
  const actorNome = actor?.nome || "Um usuário";

  const mensagem = `${actorNome} registrou ${tipoLabel.toLowerCase()} com resultado "${statusLabel}" em ${leadNome} (${boardLabel}).`;

  return Promise.all(
    destinatarios.map((usuarioId: number) =>
      createAndPublishNotification(client, {
        empresaId: oportunidade.lead.empresa_id,
        usuarioId,
        tipo: "oportunidade_interacao",
        titulo: "Nova interação na oportunidade",
        mensagem,
        link: `/crm/oportunidades?id=${oportunidade.id}`,
        payload: {
          oportunidadeId: oportunidade.id,
          leadId: oportunidade.lead_id,
          leadNome,
          board: boardLabel,
          tipoInteracao: tipoLabel,
          statusInteracao: statusLabel,
          actorUserId: params.actorUserId,
          actorNome,
          conteudo: params.conteudo || null,
        },
      }),
    ),
  );
}

export async function notifyOpportunityAssignment(
  client: PrismaLikeClient,
  params: {
    oportunidadeId: number;
    actorUserId?: number | null;
    assignedUserIds: number[];
    source: AssignmentSource;
    boardTitle?: string | null;
  },
) {
  const targetUserIds = [...new Set(params.assignedUserIds)].filter(Boolean);
  if (!targetUserIds.length) return [];

  const oportunidade = await client.oportunidade.findUnique({
    where: { id: params.oportunidadeId },
    select: {
      id: true,
      lead_id: true,
      lead: {
        select: {
          nome_lead: true,
          contato_nome: true,
          empresa_id: true,
        },
      },
      board: {
        select: {
          titulo: true,
        },
      },
    },
  });

  if (!oportunidade) return [];

  const actor = params.actorUserId
    ? await client.usuario.findUnique({
        where: { id: params.actorUserId },
        select: {
          id: true,
          nome: true,
        },
      })
    : null;

  const leadNome =
    oportunidade.lead.nome_lead ||
    oportunidade.lead.contato_nome ||
    `Oportunidade #${oportunidade.id}`;
  const boardLabel =
    params.boardTitle || oportunidade.board?.titulo || "Sem status";
  const actorNome = actor?.nome || "O sistema";
  const titulo =
    params.source === "board"
      ? "Oportunidade atribuída pela board"
      : "Você foi atribuído à oportunidade";
  const mensagem =
    params.source === "board"
      ? `${actorNome} vinculou você à oportunidade ${leadNome} na board ${boardLabel}.`
      : `${actorNome} adicionou você como responsável da oportunidade ${leadNome}.`;

  return Promise.all(
    targetUserIds
      .filter((usuarioId) => usuarioId !== params.actorUserId)
      .map((usuarioId) =>
        createAndPublishNotification(client, {
          empresaId: oportunidade.lead.empresa_id,
          usuarioId,
          tipo: "oportunidade_atribuida",
          titulo,
          mensagem,
          link: `/crm/oportunidades?id=${oportunidade.id}`,
          payload: {
            oportunidadeId: oportunidade.id,
            leadId: oportunidade.lead_id,
            leadNome,
            board: boardLabel,
            source: params.source,
            actorUserId: params.actorUserId ?? null,
            actorNome,
          },
        }),
      ),
  );
}
