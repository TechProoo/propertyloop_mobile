import api from "../client";
import type { Paginated } from "../types";

export type JobStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CONFIRMED"
  | "DISPUTED"
  | "DECLINED"
  | "CANCELLED";

export interface VendorJob {
  id: string;
  title: string;
  description?: string;
  address?: string;
  category?: string;
  status: JobStatus;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  scheduledFor?: string;
  amount: number;
  vendorFee: number;
  platformFee: number;
  escrowAmount?: number;
  escrowStatus?: string;
  paymentMethod?: string;
  completionNotes?: string;
  completionProofImages?: string[];
  attachments?: string[];
  completedAt?: string;
  confirmedAt?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    phone?: string | null;
    category?: string | null;
    rating?: number;
  } | null;
}

export interface ListJobsParams {
  status?: JobStatus;
  page?: number;
  limit?: number;
}

export interface CreateBookingPayload {
  vendorId: string;
  title: string;
  description: string;
  address: string;
  category?: string;
  vendorFee: number;
  scheduledFor: string; // ISO
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
}

const vendorJobsService = {
  createBooking(payload: CreateBookingPayload): Promise<VendorJob> {
    return api.post<VendorJob>("/vendor-jobs", payload).then((r) => r.data);
  },
  list(params?: ListJobsParams): Promise<Paginated<VendorJob>> {
    return api
      .get<Paginated<VendorJob>>("/vendor-jobs", { params: params ?? {} })
      .then((r) => r.data);
  },
  /** The signed-in buyer's own bookings. */
  listMine(params?: ListJobsParams): Promise<Paginated<VendorJob>> {
    return api
      .get<Paginated<VendorJob>>("/vendor-jobs/mine", { params: params ?? {} })
      .then((r) => r.data);
  },
  getOne(id: string): Promise<VendorJob> {
    return api.get<VendorJob>(`/vendor-jobs/${id}`).then((r) => r.data);
  },
  accept(id: string): Promise<VendorJob> {
    return api.patch<VendorJob>(`/vendor-jobs/${id}/accept`).then((r) => r.data);
  },
  decline(id: string): Promise<{ success: boolean }> {
    return api.patch(`/vendor-jobs/${id}/decline`).then((r) => r.data);
  },
  start(id: string): Promise<VendorJob> {
    return api.patch<VendorJob>(`/vendor-jobs/${id}/start`).then((r) => r.data);
  },
  complete(
    id: string,
    payload: { completionNotes?: string; completionProofImages?: string[] },
  ): Promise<VendorJob> {
    return api
      .patch<VendorJob>(`/vendor-jobs/${id}/complete`, payload)
      .then((r) => r.data);
  },
  // ─── Buyer-side ──────────────────────────────────────────────────────────
  confirm(id: string): Promise<VendorJob> {
    return api.post<VendorJob>(`/vendor-jobs/${id}/confirm`, {}).then((r) => r.data);
  },
  dispute(id: string, disputeReason: string): Promise<VendorJob> {
    return api
      .post<VendorJob>(`/vendor-jobs/${id}/dispute`, { disputeReason })
      .then((r) => r.data);
  },
};

export default vendorJobsService;
