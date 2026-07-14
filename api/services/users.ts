import api from "../client";

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
}

const usersService = {
  getProfile(): Promise<any> {
    return api.get("/users/me").then((r) => r.data);
  },
  updateProfile(payload: UpdateProfilePayload): Promise<any> {
    return api.patch("/users/me", payload).then((r) => r.data);
  },
  /**
   * Presign + PUT a locally-picked image to storage; returns the hosted URL to
   * pass as `avatarUrl` in updateProfile. Uses a direct-to-R2 PUT rather than
   * multipart through the API, which drops mid-stream on mobile networks.
   */
  async uploadAvatar(uri: string): Promise<string> {
    const contentType = "image/jpeg";
    const { data } = await api.post<{ uploadUrl: string; fileUrl: string }>(
      "/upload/avatar/presign",
      { filename: `avatar-${Date.now()}.jpg`, contentType },
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
  getSettings(): Promise<UserSettings> {
    return api.get<UserSettings>("/users/me/settings").then((r) => r.data);
  },
  updateSettings(payload: Partial<UserSettings>): Promise<UserSettings> {
    return api
      .patch<UserSettings>("/users/me/settings", payload)
      .then((r) => r.data);
  },
  /**
   * Permanently close the signed-in user's account. Backend soft-deletes the
   * record, revokes all sessions, and frees nothing sensitive to the client.
   * Required by Google Play's account-deletion policy — surfaced in Settings.
   */
  deleteAccount(): Promise<{ success: boolean }> {
    return api.delete("/users/me").then((r) => r.data);
  },
  /**
   * Reversible pause: signs the account out everywhere immediately. Logging
   * back in with the correct email/password reactivates it automatically.
   */
  deactivateAccount(): Promise<{ success: boolean }> {
    return api.patch("/users/me/deactivate").then((r) => r.data);
  },
};

export interface UserSettings {
  notifEmail: boolean;
  notifSms: boolean;
  notifMessages: boolean;
  notifPriceAlerts: boolean;
  notifMarketing: boolean;
  profileVisible: boolean;
  shareActivity: boolean;
  language: string;
  currency: string;
  twoFactorEnabled: boolean;
}

export default usersService;
