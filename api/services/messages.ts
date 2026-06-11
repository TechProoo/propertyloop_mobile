import api from "../client";

export interface Conversation {
  id: string;
  listingId?: string | null;
  productId?: string | null;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  role: string;
  otherUserId: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageIsYou: boolean;
  unread: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  senderAvatar?: string | null;
  isYou: boolean;
  text: string;
  attachmentUrls: string[];
  createdAt: string;
}

interface ConversationsPage {
  items: Conversation[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type ConversationRole = "BUYER" | "AGENT" | "VENDOR" | "ADMIN";

export interface CreateConversationPayload {
  recipientId: string;
  recipientRole: ConversationRole;
  senderRole: ConversationRole;
  listingId?: string;
  productId?: string;
  text?: string;
}

const messagesService = {
  createOrFind(
    payload: CreateConversationPayload,
  ): Promise<{ conversationId: string; created: boolean }> {
    return api
      .post("/messages/conversations", payload)
      .then((r) => r.data);
  },
  listConversations(): Promise<ConversationsPage> {
    return api
      .get<ConversationsPage>("/messages/conversations")
      .then((r) => r.data);
  },
  getMessages(conversationId: string): Promise<Message[]> {
    return api
      .get<Message[]>(`/messages/conversations/${conversationId}`)
      .then((r) => r.data);
  },
  sendMessage(
    conversationId: string,
    text: string,
    attachmentUrls?: string[],
  ): Promise<Message> {
    return api
      .post<Message>(`/messages/conversations/${conversationId}`, {
        ...(text ? { text } : {}),
        ...(attachmentUrls?.length ? { attachmentUrls } : {}),
      })
      .then((r) => r.data);
  },
  /** Upload one image/PDF (multipart) for a message. Returns the hosted URL. */
  async uploadAttachment(
    uri: string,
    opts?: { name?: string; type?: string },
  ): Promise<{ url: string; mimeType: string }> {
    const form = new FormData();
    form.append("file", {
      uri,
      name: opts?.name ?? `attachment-${Date.now()}`,
      type: opts?.type ?? "application/octet-stream",
    } as any);
    const { data } = await api.post<{ url: string; mimeType: string }>(
      "/upload/message-attachment",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { url: data.url, mimeType: data.mimeType };
  },
  markRead(conversationId: string): Promise<{ success: boolean }> {
    return api
      .post(`/messages/conversations/${conversationId}/read`, {})
      .then((r) => r.data);
  },
  unreadCount(): Promise<{ unread: number }> {
    return api.get<{ unread: number }>("/messages/unread").then((r) => r.data);
  },
};

export default messagesService;
