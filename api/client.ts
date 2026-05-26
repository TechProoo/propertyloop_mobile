import axios from "axios";

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
  headers: { "Content-Type": "application/json" },
});

// Bearer-token attach point. The token is held in memory by tokenStore
// (added when we wire auth). For now, public listing endpoints don't
// require it, so this is a no-op until auth lands.
import { tokenStore } from "./tokenStore";

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
