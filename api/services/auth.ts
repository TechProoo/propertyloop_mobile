import api from "../client";
import { tokenStore } from "../tokenStore";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "BUYER" | "AGENT" | "VENDOR";
  buyer?: { preferredLocations?: string };
  agent?: { agencyName: string; licenseNumber: string; businessAddress: string };
  vendor?: { serviceCategory: string; yearsExperience: string; serviceArea: string };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "BUYER" | "AGENT" | "VENDOR" | "ADMIN";
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: string | null;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  sessionId?: string;
}

const authService = {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/signup", payload);
    tokenStore.setAccess(data.accessToken);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    tokenStore.setAccess(data.accessToken);
    return data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout", {});
    } catch {
      /* noop */
    }
    tokenStore.clear();
  },
};

export default authService;
