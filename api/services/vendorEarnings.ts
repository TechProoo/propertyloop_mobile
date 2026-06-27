import api from "../client";
import type { Paginated } from "../types";

export interface EarningsSummary {
  total: number;
  paid: number;
  pending: number;
  processing: number;
  /** Released from escrow, sitting in the vendor's wallet, withdrawable. */
  available: number;
  thisMonth: number;
  thisYear: number;
  count: number;
}

export interface WithdrawResult {
  success: boolean;
  amount: number;
  count: number;
  bankName: string;
  accountNumber: string;
}

export interface VendorEarning {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "AVAILABLE";
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
  /** Move the available in-app balance to the vendor's bank account. */
  withdraw(): Promise<WithdrawResult> {
    return api.post<WithdrawResult>("/payments/withdraw", {}).then((r) => r.data);
  },
};

export default vendorEarningsService;
