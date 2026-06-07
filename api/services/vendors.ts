import api from "../client";

export interface VendorStats {
  profile: {
    rating: number;
    jobsCount: number;
    verified: boolean;
    availableForHire: boolean;
  };
  jobs: { pending: number; active: number; completed: number; total: number };
  earnings: { total: number; paid: number; pending: number; thisMonth: number };
  reviews: { total: number; averageRating: number; fiveStarPct: number };
}

const vendorsService = {
  getMe(): Promise<any> {
    return api.get("/vendors/me").then((r) => r.data);
  },
  getStats(): Promise<VendorStats> {
    return api.get<VendorStats>("/vendors/me/stats").then((r) => r.data);
  },
  updateMe(payload: Record<string, unknown>): Promise<any> {
    return api.patch("/vendors/me", payload).then((r) => r.data);
  },

  /** Presign + PUT one image to storage; returns the public URL. */
  async uploadImage(uri: string): Promise<string> {
    const contentType = "image/jpeg";
    const { data } = await api.post<{ uploadUrl: string; fileUrl: string }>(
      "/vendors/me/portfolio/presign",
      { filename: `upload-${Date.now()}.jpg`, contentType, kind: "portfolio" },
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
