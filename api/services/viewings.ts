import api from "../client";

export type ViewingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Viewing {
  id: string;
  listingId: string;
  agentId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  scheduledFor: string;
  status: ViewingStatus;
  notes?: string | null;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    coverImage: string;
    location: string;
    slug?: string;
  };
  agent?: {
    id: string;
    name: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

export interface CreateViewingPayload {
  listingId: string;
  scheduledFor: string; // ISO
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const viewingsService = {
  create(payload: CreateViewingPayload): Promise<Viewing> {
    return api.post<Viewing>("/viewings", payload).then((r) => r.data);
  },
  listMine(upcoming?: boolean): Promise<Paginated<Viewing>> {
    return api
      .get<Paginated<Viewing>>("/viewings/me", {
        params: upcoming ? { upcoming: true } : {},
      })
      .then((r) => r.data);
  },
  cancelMine(id: string): Promise<Viewing> {
    return api.post<Viewing>(`/viewings/me/${id}/cancel`, {}).then((r) => r.data);
  },
};

export default viewingsService;
