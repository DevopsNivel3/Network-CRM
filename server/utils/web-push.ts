import type { PrismaClient } from "@prisma/client";
import webpush from "web-push";

type PrismaLikeClient = PrismaClient | any;

type PushNotificationPayload = {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string | null;
  tipo: string;
  criado: string;
  payload?: Record<string, any> | null;
};

type StoredPushSubscription = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: string | number | null;
  userAgent?: string | null;
};

const configuredState = globalThis as typeof globalThis & {
  __webPushConfigured?: string;
};

const getPushConfig = () => {
  const config = useRuntimeConfig();

  const publicKey = String(
    config.public.PUSH_VAPID_PUBLIC_KEY ||
      process.env.NUXT_PUBLIC_PUSH_VAPID_PUBLIC_KEY ||
      "",
  ).trim();
  const privateKey = String(
    config.PUSH_VAPID_PRIVATE_KEY || process.env.PUSH_VAPID_PRIVATE_KEY || "",
  ).trim();
  const subject = String(
    config.PUSH_VAPID_SUBJECT ||
      process.env.PUSH_VAPID_SUBJECT ||
      "mailto:suporte@localhost.local",
  ).trim();

  return {
    publicKey,
    privateKey,
    subject,
    enabled: Boolean(publicKey && privateKey),
  };
};

const ensureWebPushConfigured = () => {
  const config = getPushConfig();
  if (!config.enabled) return config;

  const cacheKey = `${config.subject}|${config.publicKey}|${config.privateKey}`;
  if (configuredState.__webPushConfigured !== cacheKey) {
    webpush.setVapidDetails(
      config.subject,
      config.publicKey,
      config.privateKey,
    );
    configuredState.__webPushConfigured = cacheKey;
  }

  return config;
};

const parseExpiration = (expirationTime?: string | number | null) => {
  if (expirationTime === undefined || expirationTime === null) return null;

  const parsed = new Date(expirationTime);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isWebPushEnabled = () => ensureWebPushConfigured().enabled;

export const getPublicPushKey = () => ensureWebPushConfigured().publicKey;

export async function savePushSubscription(
  client: PrismaLikeClient,
  usuarioId: number,
  empresaId: number | null | undefined,
  subscription: PushSubscriptionInput,
) {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Assinatura push inválida");
  }

  return client.pushSubscription.upsert({
    where: {
      endpoint: subscription.endpoint,
    },
    update: {
      usuario_id: usuarioId,
      empresa_id: empresaId ?? null,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expiration: parseExpiration(subscription.expirationTime),
      user_agent: subscription.userAgent ?? null,
    },
    create: {
      usuario_id: usuarioId,
      empresa_id: empresaId ?? null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expiration: parseExpiration(subscription.expirationTime),
      user_agent: subscription.userAgent ?? null,
    },
  });
}

export async function deletePushSubscription(
  client: PrismaLikeClient,
  usuarioId: number,
  endpoint: string,
) {
  return client.pushSubscription.deleteMany({
    where: {
      usuario_id: usuarioId,
      endpoint,
    },
  });
}

export async function deleteInvalidPushSubscription(
  client: PrismaLikeClient,
  subscriptionId: number,
) {
  return client.pushSubscription.delete({
    where: {
      id: subscriptionId,
    },
  });
}

export async function sendPushNotificationToUser(
  client: PrismaLikeClient,
  usuarioId: number,
  notification: PushNotificationPayload,
) {
  const config = ensureWebPushConfigured();
  if (!config.enabled) return false;

  const subscriptions = (await client.pushSubscription.findMany({
    where: {
      usuario_id: usuarioId,
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  })) as StoredPushSubscription[];

  if (!subscriptions.length) return false;

  const payload = JSON.stringify({
    title: notification.titulo,
    body: notification.mensagem,
    icon: "/icon/favicon-96x96.png",
    badge: "/icon/web-app-manifest-192x192.png",
    tag: `crm-notificacao-${notification.id}`,
    data: {
      id: notification.id,
      link: notification.link || "/crm/oportunidades",
      tipo: notification.tipo,
      payload: notification.payload || null,
      criado: notification.criado,
    },
  });

  let delivered = false;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
      );
      delivered = true;
    } catch (error: any) {
      const statusCode = Number(error?.statusCode || error?.status || 0);
      if (statusCode === 404 || statusCode === 410) {
        await deleteInvalidPushSubscription(client, subscription.id).catch(() => {});
      }
      console.error("Erro ao enviar Web Push", error);
    }
  }

  return delivered;
}
