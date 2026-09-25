const PROMPT_STORAGE_KEY = "notificacoes_browser_prompted_v1";
const SEEN_STORAGE_KEY = "notificacoes_browser_seen_v1";
const RECONNECT_DELAY = 3000;
const MAX_SEEN_IDS = 200;

type NotificationItem = {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
  payload?: Record<string, any> | null;
  criado: string;
  lida?: boolean;
  lida_em?: string | null;
  entregue_em?: string | null;
};

type SerializablePushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
};

const readSeenIds = () => {
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<number>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<number>();
  }
};

const persistSeenIds = (ids: Set<number>) => {
  sessionStorage.setItem(
    SEEN_STORAGE_KEY,
    JSON.stringify(Array.from(ids).slice(-MAX_SEEN_IDS)),
  );
};

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const router = useRouter();
  const runtimeConfig = useRuntimeConfig();
  const { status, token } = useAuth();
  const notifications = useNotifications();
  const seenIds = readSeenIds();
  const vapidPublicKey = runtimeConfig.public.PUSH_VAPID_PUBLIC_KEY;
  const canUseWebPush =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(vapidPublicKey);
  let streamSource: EventSource | null = null;
  let reconnectTimer: number | null = null;

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);

    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  const serializeSubscription = (
    subscription: PushSubscription,
  ): SerializablePushSubscription => {
    const json = subscription.toJSON();

    return {
      endpoint: subscription.endpoint,
      expirationTime:
        subscription.expirationTime ?? json.expirationTime ?? null,
      keys: {
        p256dh: json.keys?.p256dh || "",
        auth: json.keys?.auth || "",
      },
      userAgent: navigator.userAgent,
    };
  };

  const ensureServiceWorkerRegistration = async () => {
    if (!canUseWebPush) return null;

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.error("Erro ao registrar service worker de notificações", err);
      return null;
    }
  };

  const markAsSeen = (id: number) => {
    seenIds.add(id);
    persistSeenIds(seenIds);
  };

  const closeStream = () => {
    if (streamSource) {
      streamSource.close();
      streamSource = null;
    }
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const acknowledgeNotifications = async (ids: number[]) => {
    if (!ids.length) return;

    try {
      await useApi("/api/notificacoes/ack", {
        method: "POST",
        body: { ids },
      });
    } catch {}
  };

  const openNotificationLink = async (item: NotificationItem) => {
    if (item.link) await router.push(item.link);
    window.focus();
  };

  const showToastNotification = (item: NotificationItem) => {
    ElNotification({
      title: item.titulo,
      message: item.mensagem,
      duration: 12000,
      position: "top-right",
      customClass: "crm-browser-notification",
      onClick: () => openNotificationLink(item),
    });
  };

  const showNativeNotification = (item: NotificationItem) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const notification = new Notification(item.titulo, {
      body: item.mensagem,
      icon: "/icon/favicon-96x96.png",
      tag: `crm-notificacao-${item.id}`,
      data: {
        id: item.id,
        link: item.link,
      },
    });

    notification.onclick = () => {
      notification.close();
      openNotificationLink(item);
    };
  };

  const syncPushSubscription = async () => {
    if (!canUseWebPush) return;
    if (status.value !== "authenticated") return;
    if (Notification.permission !== "granted") return;

    const registration = await ensureServiceWorkerRegistration();
    if (!registration) return;

    try {
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      await useApi("/api/notificacoes/push/subscribe", {
        method: "POST",
        body: serializeSubscription(subscription),
      });
    } catch (err) {
      console.error("Erro ao sincronizar assinatura Web Push", err);
    }
  };

  const unsubscribePushSubscription = async () => {
    if (!canUseWebPush) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;

      await useApi("/api/notificacoes/push/unsubscribe", {
        method: "POST",
        body: {
          endpoint: subscription.endpoint,
        },
      }).catch(() => {});

      await subscription.unsubscribe().catch(() => {});
    } catch (err) {
      console.error("Erro ao remover assinatura Web Push", err);
    }
  };

  const handleIncomingNotification = async (item?: NotificationItem | null) => {
    if (!item?.id) return;

    notifications.mergeNotification({
      ...item,
      lida: false,
      lida_em: null,
      entregue_em: item.entregue_em || null,
    });

    if (seenIds.has(item.id)) return;

    markAsSeen(item.id);

    const browserGranted =
      "Notification" in window && Notification.permission === "granted";
    const pageIsVisible =
      document.visibilityState === "visible" && document.hasFocus();

    if (browserGranted) {
      showNativeNotification(item);
    }

    if (!browserGranted || pageIsVisible) {
      showToastNotification(item);
    }

    await acknowledgeNotifications([item.id]);
  };

  const fetchPendingNotifications = async () => {
    if (status.value !== "authenticated") return;

    try {
      const notifications = await useApi<NotificationItem[]>(
        "/api/notificacoes",
        {
          method: "GET",
          query: {
            limit: 30,
            onlyPendingBrowser: true,
          },
        },
      );

      useNotifications().mergeNotifications(
        notifications.map((item) => ({
          ...item,
          lida: item.lida ?? false,
        })),
      );
      await useNotifications().fetchUnreadCount();

      for (const item of notifications) {
        await handleIncomingNotification(item);
      }
    } catch {}
  };

  const ensureBrowserPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(PROMPT_STORAGE_KEY) === "1") return;

    localStorage.setItem(PROMPT_STORAGE_KEY, "1");
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await syncPushSubscription();
      }
    } catch {}
  };

  const scheduleReconnect = () => {
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(() => {
      openStream();
    }, RECONNECT_DELAY);
  };

  const openStream = () => {
    if (status.value !== "authenticated" || !token.value) return;

    closeStream();

    const url = `/api/notificacoes/stream?token=${encodeURIComponent(
      token.value || "",
    )}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== "notification") return;
        handleIncomingNotification(payload.notification);
      } catch (err) {
        console.error(err);
      }
    };

    source.onerror = () => {
      closeStream();
      scheduleReconnect();
    };

    streamSource = source;
  };

  watch(
    () => status.value,
    async (newStatus, oldStatus) => {
      if (newStatus === "authenticated") {
        await ensureBrowserPermission();
        await syncPushSubscription();
        await notifications.refresh();
        await fetchPendingNotifications();
        openStream();
      }

      if (oldStatus === "authenticated" && newStatus !== "authenticated") {
        await unsubscribePushSubscription();
        notifications.setItems([]);
        closeStream();
      }
    },
    { immediate: true },
  );

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      fetchPendingNotifications();
    }
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      closeStream();
    });
  }
});
