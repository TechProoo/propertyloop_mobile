import api from "../client";

export interface AgentStats {
  profile: {
    rating: number;
    listingsCount: number;
    soldRentedCount: number;
    verified: boolean;
    yearsExperience: number;
  };
  listings: {
    total: number;
    active: number;
    pendingReview: number;
    totalViews: number;
  };
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
  };
  viewings: {
    total: number;
    upcoming: number;
  };
}

export interface PublicAgent {
  id: string;
  name: string;
  avatarUrl?: string | null;
  rating?: number;
  listingsCount?: number;
  location?: string | null;
  specialties?: string[];
  verified?: boolean;
}

const agentsService = {
  /** Public agents marketplace list. */
  list(params?: {
    sort?: "top_rated" | "most_listings" | "most_deals" | "top_performers" | "newest";
    search?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<{ items: PublicAgent[]; total: number; pages: number }> {
    return api.get("/agents", { params: params ?? {} }).then((r) => r.data);
  },
  getMe(): Promise<any> {
    return api.get("/agents/me").then((r) => r.data);
  },
  getPublic(agentId: string): Promise<any> {
    return api.get(`/agents/${agentId}`).then((r) => r.data);
  },
  getStats(): Promise<AgentStats> {
    return api.get<AgentStats>("/agents/me/stats").then((r) => r.data);
  },
  getSubscription(): Promise<AgentSubscription> {
    return api.get<AgentSubscription>("/agents/me/subscription").then((r) => r.data);
  },
  initCheckout(
    tier: "STANDARD" | "PRO",
    returnUrl?: string,
  ): Promise<{ paymentUrl: string; reference: string }> {
    return api
      .post("/agents/me/subscription/checkout", {
        tier,
        ...(returnUrl ? { returnUrl } : {}),
      })
      .then((r) => r.data);
  },
  /**
   * Actively confirm a subscription charge with Paystack (verify-on-return).
   * Activates the plan server-side without waiting on the webhook.
   */
  verifySubscription(reference: string): Promise<{
    paymentStatus: "success" | "failed" | "pending";
    tier: AgentSubscription["tier"];
    status: AgentSubscription["status"];
    renewsAt: string | null;
  }> {
    return api
      .get(`/payments/subscription/verify/${reference}`)
      .then((r) => r.data);
  },
  cancelSubscription(): Promise<{ success: boolean }> {
    return api.post("/agents/me/subscription/cancel", {}).then((r) => r.data);
  },
};

export interface AgentSubscription {
  tier: "FOUNDING" | "STANDARD" | "PRO" | null;
  status: "ACTIVE" | "LAPSED" | "CANCELLED" | null;
  renewsAt: string | null;
  paystackSubscriptionCode: string | null;
}

export default agentsService;
