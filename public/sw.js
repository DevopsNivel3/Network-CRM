self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Nova notificacao",
      body: event.data.text(),
    };
  }

  const title = payload.title || "Nova notificacao";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon/favicon-96x96.png",
    badge: payload.badge || "/icon/web-app-manifest-192x192.png",
    tag: payload.tag || undefined,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.link || "/crm/oportunidades";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      async (clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            await client.navigate(targetUrl);
            await client.focus();
            return;
          }
        }

        if (self.clients.openWindow) {
          await self.clients.openWindow(targetUrl);
        }
      },
    ),
  );
});
