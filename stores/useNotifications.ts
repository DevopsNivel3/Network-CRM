export interface NotificationItem {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
  payload?: Record<string, any> | null;
  lida: boolean;
  lida_em?: string | null;
  entregue_em?: string | null;
  criado: string;
}

interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
}

export const useNotifications = defineStore("notifications", {
  state: (): NotificationsState => ({
    items: [],
    unreadCount: 0,
    isLoading: false,
  }),
  actions: {
    getOpportunityNotificationIds(opportunityId: number) {
      return this.items
        .filter(
          (item) =>
            !item.lida &&
            Number(item.payload?.oportunidadeId || 0) === opportunityId,
        )
        .map((item) => item.id);
    },
    async markIdsAsRead(ids: number[]) {
      const uniqueIds = [...new Set(ids)].filter(Boolean);
      if (!uniqueIds.length) return;

      const previousItems = this.items.map((item) => ({ ...item }));
      const now = new Date().toISOString();

      this.items = this.items.map((item) =>
        uniqueIds.includes(item.id)
          ? { ...item, lida: true, lida_em: item.lida_em || now }
          : item,
      );
      this.unreadCount = this.items.filter((item) => !item.lida).length;

      try {
        await useApi("/api/notificacoes/read", {
          method: "POST",
          body: { ids: uniqueIds },
        });
      } catch (err: any) {
        this.items = previousItems;
        this.unreadCount = previousItems.filter((item) => !item.lida).length;
        useErr().setMessage(
          err?.data?.message || "Erro ao marcar notificações como lidas",
        );
      }
    },
    setIsLoading(value: boolean) {
      this.isLoading = value;
    },
    setItems(items: NotificationItem[]) {
      this.items = items;
      this.unreadCount = items.filter((item) => !item.lida).length;
    },
    mergeNotification(item: NotificationItem) {
      const index = this.items.findIndex((current) => current.id === item.id);

      if (index >= 0) {
        this.items[index] = {
          ...this.items[index],
          ...item,
        };
      } else {
        this.items.unshift(item);
      }

      this.items = this.items
        .sort(
          (a, b) =>
            new Date(b.criado).getTime() - new Date(a.criado).getTime(),
        )
        .slice(0, 50);
      this.unreadCount = this.items.filter((current) => !current.lida).length;
    },
    mergeNotifications(items: NotificationItem[]) {
      items.forEach((item) => this.mergeNotification(item));
    },
    async fetchNotifications(limit = 30) {
      this.setIsLoading(true);

      try {
        const notifications = await useApi<NotificationItem[]>(
          "/api/notificacoes",
          {
            method: "GET",
            query: { limit },
          },
        );

        this.setItems(notifications);
      } catch (err: any) {
        useErr().setMessage(
          err?.data?.message || "Erro ao carregar notificações",
        );
      } finally {
        this.setIsLoading(false);
      }
    },
    async fetchUnreadCount() {
      try {
        const payload = await useApi<{ count: number }>("/api/notificacoes/unread", {
          method: "GET",
        });

        this.unreadCount = payload.count;
      } catch {}
    },
    async refresh(limit = 30) {
      await Promise.all([
        this.fetchNotifications(limit),
        this.fetchUnreadCount(),
      ]);
    },
    async markAsRead(id: number) {
      const target = this.items.find((item) => item.id === id);
      if (!target || target.lida) return;
      await this.markIdsAsRead([id]);
    },
    async markOpportunityAsRead(opportunityId: number) {
      const ids = this.getOpportunityNotificationIds(opportunityId);
      await this.markIdsAsRead(ids);
    },
    async markAllAsRead() {
      const unreadIds = this.items
        .filter((item) => !item.lida)
        .map((item) => item.id);

      if (!unreadIds.length) return;

      this.items = this.items.map((item) => ({
        ...item,
        lida: true,
        lida_em: item.lida_em || new Date().toISOString(),
      }));
      this.unreadCount = 0;

      try {
        await useApi("/api/notificacoes/read", {
          method: "POST",
          body: { all: true },
        });
      } catch (err: any) {
        await this.refresh();
        useErr().setMessage(
          err?.data?.message || "Erro ao marcar notificações como lidas",
        );
      }
    },
  },
});
