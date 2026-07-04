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
  /** For your own messages: true once the other side has read the thread. */
  read?: boolean;
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
  /** Find-or-create this user's PropertyLoop support chat; returns its id. */
  startSupport(): Promise<{ conversationId: string; created: boolean }> {
    return api.post("/messages/support", {}).then((r) => r.data);
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
  /**
   * Upload one image/PDF for a message and return the hosted URL.
   *
   * Uses a presigned direct-to-R2 PUT — the same path as listings/vendors image
   * uploads. Proxying multipart/form-data through the API dropped mid-stream on
   * mobile networks ("Network Error"), which was why chat image attachments
   * kept failing. Sending the bytes straight to storage fixes that.
   */
  async uploadAttachment(
    uri: string,
    opts?: { name?: string; type?: string },
  ): Promise<{ url: string; mimeType: string }> {
    const contentType = opts?.type ?? "image/jpeg";
    const filename = opts?.name ?? `attachment-${Date.now()}.jpg`;

    // Read the local file (file:// or content://) into a blob.
    const blob = await (await fetch(uri)).blob();

    // 1) Ask the API for a short-lived presigned PUT URL.
    const { data } = await api.post<{ uploadUrl: string; fileUrl: string }>(
      "/upload/message-attachment/presign",
      { filename, contentType },
    );

    // 2) Upload the bytes straight to storage (same Content-Type as signed).
    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
    if (!put.ok) throw new Error(`Storage upload failed (${put.status})`);

    return { url: data.fileUrl, mimeType: contentType };
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
