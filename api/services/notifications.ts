import api from "../client";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationsPage {
  items: AppNotification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
  pages: number;
}

const notificationsService = {
  list(unread?: boolean): Promise<NotificationsPage> {
    return api
      .get<NotificationsPage>("/notifications", {
        params: unread ? { unread: true } : {},
      })
      .then((r) => r.data);
  },
  unreadCount(): Promise<{ unread: number }> {
    return api
      .get<{ unread: number }>("/notifications/unread-count")
      .then((r) => r.data);
  },
  markRead(id: string): Promise<{ success: boolean }> {
    return api.post(`/notifications/${id}/read`, {}).then((r) => r.data);
  },
  markAllRead(): Promise<{ success: boolean; updated: number }> {
    return api.post("/notifications/read-all", {}).then((r) => r.data);
  },
  registerPushToken(
    token: string,
    platform?: "ios" | "android",
  ): Promise<{ success: boolean }> {
    return api
      .post("/notifications/push-tokens", { token, platform })
      .then((r) => r.data);
  },
};

export default notificationsService;
