import api from "../client";
import { tokenStore } from "../tokenStore";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "BUYER" | "AGENT" | "VENDOR";
  buyer?: { preferredLocations?: string; lookingFor?: string; budgetRange?: string };
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
  refreshToken?: string;
  sessionId?: string;
}

const authService = {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/signup", payload);
    await tokenStore.setSession(data.accessToken, data.refreshToken ?? null);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    await tokenStore.setSession(data.accessToken, data.refreshToken ?? null);
    return data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>("/auth/me");
    return data;
  },

  // Re-sends the email-verification link. Public + rate-limited (3/60s on the
  // server) and always 200 even for unknown/verified emails, so we never leak
  // whether an address is registered. Used by the "Check your inbox" screen.
  async resendVerification(email: string): Promise<void> {
    await api.post("/auth/resend-verification-public", { email });
  },

  // Email a 6-digit password-reset code. Always resolves (even for unknown
  // emails) so we never leak which addresses are registered.
  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", {
      email: email.trim().toLowerCase(),
    });
  },

  // Complete the reset with the emailed code + a new password.
  async resetPassword(payload: {
    email: string;
    code: string;
    password: string;
  }): Promise<void> {
    await api.post("/auth/reset-password", {
      email: payload.email.trim().toLowerCase(),
      code: payload.code.trim(),
      password: payload.password,
    });
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout", {});
    } catch {
      /* noop */
    }
    await tokenStore.clear();
  },
};

export default authService;
