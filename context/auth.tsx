import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import authService, {
  type AuthUser,
  type LoginPayload,
  type SignupPayload,
} from "@/api/services/auth";
import { refreshSession, setOnSessionExpired } from "@/api/client";
import { syncSavedFromServer, clearSaved } from "@/lib/favourites";
import { getChatSocket, disconnectChatSocket } from "@/api/socket";

type Status = "loading" | "authed" | "guest";

interface AuthContextValue {
  user: AuthUser | null;
  status: Status;
  isAuthed: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  signUp: (payload: SignupPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Bootstrap: try to recover a session from the stored refresh token.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await refreshSession();
      if (!token) {
        if (mounted) setStatus("guest");
        return;
      }
      try {
        const me = await authService.me();
        if (mounted) {
          setUser(me);
          setStatus("authed");
          void syncSavedFromServer();
          getChatSocket();
        }
      } catch {
        if (mounted) setStatus("guest");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // When a mid-session refresh fails, drop the user to logged-out.
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setStatus("guest");
    });
    return () => setOnSessionExpired(null);
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    setUser(res.user);
    setStatus("authed");
    void syncSavedFromServer();
    getChatSocket();
    return res.user;
  }, []);

  const signUp = useCallback(async (payload: SignupPayload) => {
    const res = await authService.signup(payload);
    setUser(res.user);
    setStatus("authed");
    getChatSocket();
    return res.user;
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus("guest");
    clearSaved();
    disconnectChatSocket();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
    } catch {
      /* keep current */
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthed: status === "authed" && !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Home route for a given role — where a returning user lands. */
export function roleHome(role: AuthUser["role"]): string {
  switch (role) {
    case "AGENT":
      return "/(agent-tabs)";
    case "VENDOR":
      return "/(vendor-tabs)";
    default:
      return "/(tabs)";
  }
}
