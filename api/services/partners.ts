import api from "../client";
import type { Listing } from "../types";

/**
 * Agent Partner Programme.
 *
 * A partner is an ordinary AGENT account with an AgentPartner record attached.
 * These endpoints only answer for that account — everything else gets a 403,
 * which the UI treats as "not a partner yet" rather than an error.
 */

export type PartnerStatus =
  | "NEW"
  | "CONTACTED"
  | "VERIFIED"
  | "ACTIVE"
  | "DORMANT"
  | "REJECTED";

export type PartnerCommissionStatus =
  | "PENDING"
  | "APPROVED"
  | "PAID"
  | "REJECTED";

export interface PartnerCommission {
  id: string;
  listing: string | null;
  amountNaira: number;
  status: PartnerCommissionStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface PartnerMe {
  code: string;
  status: PartnerStatus;
  /** Their own link — anyone registering through it is credited to them. */
  referralUrl: string;
  payoutReady: boolean;
  /** Exactly what is still missing, e.g. ["NIN", "bank account"]. */
  payoutGaps: string[];
  introductions: number;
  commissions: PartnerCommission[];
}

/** Listing fields the inventory endpoint returns — a subset of Listing. */
export type HouseListing = Pick<
  Listing,
  | "id"
  | "slug"
  | "title"
  | "location"
  | "address"
  | "type"
  | "propertyType"
  | "priceNaira"
  | "priceLabel"
  | "beds"
  | "baths"
  | "coverImage"
  | "verified"
>;

export interface HouseInventory {
  items: HouseListing[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  /** What a partner earns on a sale, as a percentage. */
  commissionPercent: number;
}

export interface IntroduceBuyerPayload {
  name: string;
  phone: string;
  email?: string;
  message?: string;
}

const partnersService = {
  /** Null when the signed-in account is not a partner. */
  async me(): Promise<PartnerMe | null> {
    try {
      const { data } = await api.get<PartnerMe>("/partners/me");
      return data;
    } catch {
      // 403 means "not a partner", which is a normal state for most agents,
      // not a failure worth surfacing.
      return null;
    }
  },

  /**
   * PropertyLoop's own stock — the inventory a partner may sell.
   *
   * Only house listings that are actually published. An agent's own listing
   * belongs to them, and an unpublished one is not ready to be sold to
   * anybody.
   */
  async inventory(params: {
    page?: number;
    limit?: number;
    state?: string;
  } = {}): Promise<HouseInventory> {
    const { data } = await api.get<HouseInventory>("/partners/inventory", {
      params,
    });
    return data;
  },

  /**
   * Record a buyer introduction against a house listing.
   *
   * This is the attribution, and it happens BEFORE the sale — afterwards
   * "I brought that buyer" is a claim with nothing behind it. Submitting the
   * same person twice returns the original introduction rather than creating
   * a second claim on the commission.
   */
  async introduce(
    listingId: string,
    payload: IntroduceBuyerPayload,
  ): Promise<{ leadId: string; duplicate: boolean }> {
    const { data } = await api.post<{ leadId: string; duplicate: boolean }>(
      `/partners/inventory/${listingId}/introduce`,
      payload,
    );
    return data;
  },
};

export default partnersService;
