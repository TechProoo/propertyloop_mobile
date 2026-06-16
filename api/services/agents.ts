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

const agentsService = {
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
  ): Promise<{ paymentUrl: string; reference: string }> {
    return api
      .post("/agents/me/subscription/checkout", { tier })
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
