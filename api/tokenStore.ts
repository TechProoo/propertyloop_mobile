import * as SecureStore from "expo-secure-store";

// Access token: short-lived, kept in memory only (lost on app restart, then
// recovered from the refresh token during bootstrap).
// Refresh token: long-lived (30 days), persisted in the OS secure enclave
// (iOS Keychain / Android Keystore) via expo-secure-store.

const REFRESH_KEY = "pl_refresh_token";

let accessToken: string | null = null;

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },

  setAccess(token: string | null) {
    accessToken = token;
  },

  async getRefresh(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY);
    } catch {
      return null;
    }
  },

  async setRefresh(token: string | null): Promise<void> {
    try {
      if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);
      else await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch {
      /* secure store unavailable — non-fatal */
    }
  },

  /** Set both tokens at once (after login/signup/refresh). */
  async setSession(access: string | null, refresh: string | null): Promise<void> {
    accessToken = access;
    await this.setRefresh(refresh);
  },

  async clear(): Promise<void> {
    accessToken = null;
    await this.setRefresh(null);
  },
};
