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
  getStats(): Promise<AgentStats> {
    return api.get<AgentStats>("/agents/me/stats").then((r) => r.data);
  },
};

export default agentsService;
