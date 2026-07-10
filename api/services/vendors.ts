import api from "../client";

export interface VendorStats {
  profile: {
    rating: number;
    jobsCount: number;
    verified: boolean;
    availableForHire: boolean;
  };
  jobs: { pending: number; active: number; completed: number; total: number };
  earnings: { total: number; paid: number; pending: number; available: number; processing: number; thisMonth: number };
  reviews: { total: number; averageRating: number; fiveStarPct: number };
}

const vendorsService = {
  getMe(): Promise<any> {
    return api.get("/vendors/me").then((r) => r.data);
  },
  /**
   * True when the vendor still needs to run the setup wizard. Signup never sets
   * a bio, so an empty bio means the trade profile hasn't been set up yet. Any
   * network/parse error resolves to false so a transient failure can't trap a
   * returning, fully-onboarded vendor on the onboarding screen.
   */
  async needsOnboarding(): Promise<boolean> {
    try {
      const me = await this.getMe();
      return !String(me?.bio ?? "").trim();
    } catch {
      return false;
    }
  },
  getStats(): Promise<VendorStats> {
    return api.get<VendorStats>("/vendors/me/stats").then((r) => r.data);
  },
  updateMe(payload: Record<string, unknown>): Promise<any> {
    return api.patch("/vendors/me", payload).then((r) => r.data);
  },

  getAvailability(): Promise<any> {
    return api.get("/vendors/me/availability").then((r) => r.data);
  },
  updateAvailability(payload: {
    acceptingBookings?: boolean;
    maxJobsPerDay?: number;
    responseCommitment?: string;
    schedule?: { day: string; on: boolean; hours: string }[];
  }): Promise<any> {
    return api.patch("/vendors/me/availability", payload).then((r) => r.data);
  },
  addBlackouts(dates: string[], reason?: string): Promise<any> {
    return api.post("/vendors/me/blackouts", { dates, reason }).then((r) => r.data);
  },
  list(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; total: number; pages: number }> {
    return api.get("/vendors", { params: params ?? {} }).then((r) => r.data);
  },
  getPublic(vendorId: string): Promise<any> {
    return api.get(`/vendors/${vendorId}`).then((r) => r.data);
  },
  getPublicServices(vendorId: string): Promise<any[]> {
    return api.get(`/vendors/${vendorId}/services`).then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.items ?? []);
    });
  },
  getReviews(vendorId: string): Promise<any[]> {
    return api.get(`/vendors/${vendorId}/reviews`).then((r) => r.data);
  },
  replyToReview(reviewId: string, reply: string): Promise<any> {
    return api
      .post(`/vendors/me/reviews/${reviewId}/reply`, { reply })
      .then((r) => r.data);
  },

  /** Presign + PUT one image to storage; returns the public URL. */
  async uploadImage(
    uri: string,
    kind: "portfolio" | "banner" = "portfolio",
  ): Promise<string> {
    const contentType = "image/jpeg";
    const { data } = await api.post<{ uploadUrl: string; fileUrl: string }>(
      "/vendors/me/portfolio/presign",
      { filename: `upload-${Date.now()}.jpg`, contentType, kind },
    );
    const fileRes = await fetch(uri);
    const blob = await fileRes.blob();
    await fetch(data.uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
    return data.fileUrl;
  },
};

export default vendorsService;
