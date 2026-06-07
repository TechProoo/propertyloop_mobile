import api from "../client";
import type { Paginated } from "../types";

export interface EarningsSummary {
  total: number;
  paid: number;
  pending: number;
  processing: number;
  thisMonth: number;
  thisYear: number;
  count: number;
}

export interface VendorEarning {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID";
  createdAt: string;
  paidAt?: string | null;
  job?: {
    id: string;
    title: string;
    clientName?: string | null;
    category?: string | null;
    scheduledFor?: string | null;
  } | null;
}

const vendorEarningsService = {
  getSummary(): Promise<EarningsSummary> {
    return api.get<EarningsSummary>("/vendor-earnings/summary").then((r) => r.data);
  },
  list(params?: { page?: number; limit?: number }): Promise<Paginated<VendorEarning>> {
    return api
      .get<Paginated<VendorEarning>>("/vendor-earnings", { params: params ?? {} })
      .then((r) => r.data);
  },
};

export default vendorEarningsService;
