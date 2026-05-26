// Access token held in memory (volatile across app restarts).
// Refresh token will live in expo-secure-store once auth is wired —
// SecureStore is OS-level encrypted storage (iOS Keychain / Android
// Keystore), better than HttpOnly cookies for mobile.

let accessToken: string | null = null;

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },
  setAccess(token: string | null) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
  },
};
