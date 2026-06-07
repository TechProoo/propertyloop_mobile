import axios from "axios";
import { tokenStore } from "./tokenStore";

// EXPO_PUBLIC_* env vars are baked into the JS bundle at build time and
// readable on the device. Set EXPO_PUBLIC_API_URL in .env at project root.
const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://propertyloop-backend.up.railway.app/api";

const api = axios.create({
  baseURL,
  // 90s default — Railway free-tier cold starts can take 30-60s on the
  // first request after idle.
  timeout: 90_000,
  headers: {
    "Content-Type": "application/json",
    // Tells the backend to return the refresh token in the JSON body (React
    // Native has no cookie jar). See auth.controller attachRefreshCookie.
    "X-Client-Platform": "mobile",
  },
});

// ─── Request: attach the access token ───────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Single-flight refresh ──────────────────────────────────────────────────
//
// On a 401 we mint a new access token from the stored refresh token. All
// concurrent 401s share one in-flight refresh so the rotating refresh token
// isn't replayed (which the backend would flag as reuse).

let onSessionExpired: (() => void) | null = null;

/** Let the auth context react when the session can no longer be refreshed. */
export function setOnSessionExpired(cb: (() => void) | null) {
  onSessionExpired = cb;
}

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = await tokenStore.getRefresh();
  if (!rt) return null;
  try {
    // Bare axios (not `api`) so we don't recurse through this interceptor.
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      { refreshToken: rt },
      { headers: { "X-Client-Platform": "mobile" } },
    );
    await tokenStore.setSession(data.accessToken, data.refreshToken ?? rt);
    return data.accessToken as string;
  } catch {
    await tokenStore.clear();
    return null;
  }
}

export function refreshSession(): Promise<string | null> {
  if (!refreshPromise) {
    const p = doRefresh();
    refreshPromise = p;
    const clear = () => {
      if (refreshPromise === p) refreshPromise = null;
    };
    p.then(clear, clear);
  }
  return refreshPromise;
}

// ─── Response: refresh once on 401, then retry ──────────────────────────────

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url || "";
    const isAuthCall =
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/signup");

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const newToken = await refreshSession();
      if (newToken) {
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api(original);
      }
      // Refresh failed — session is gone. Let the app log out.
      onSessionExpired?.();
    }
    return Promise.reject(error);
  },
);

export default api;
