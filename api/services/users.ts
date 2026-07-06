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
