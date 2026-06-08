import api from "../client";
import type { Paginated } from "../types";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "VIEWING_SCHEDULED"
  | "NEGOTIATING"
  | "CONVERTED"
  | "LOST";

export interface Lead {
  id: string;
  listingId: string;
  agentId: string;
  buyerUserId?: string | null;
  name: string;
  email?: string | null;
  phone: string;
  message?: string | null;
  source: string;
  status: LeadStatus;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    coverImage?: string;
    location?: string;
    slug?: string;
  } | null;
}

const leadsService = {
  list(params?: {
    status?: LeadStatus;
    page?: number;
    limit?: number;
  }): Promise<Paginated<Lead>> {
    return api
      .get<Paginated<Lead>>("/leads", { params: params ?? {} })
      .then((r) => r.data);
  },
  update(
    id: string,
    payload: { status?: LeadStatus; notes?: string },
  ): Promise<Lead> {
    return api.patch<Lead>(`/leads/${id}`, payload).then((r) => r.data);
  },
};

export default leadsService;
