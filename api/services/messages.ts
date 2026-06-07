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

const messagesService = {
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
  sendMessage(conversationId: string, text: string): Promise<Message> {
    return api
      .post<Message>(`/messages/conversations/${conversationId}`, { text })
      .then((r) => r.data);
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
