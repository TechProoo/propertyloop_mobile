import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { router, type Href } from "expo-router";
import authService, {
  type AuthUser,
  type LoginPayload,
  type SignupPayload,
} from "@/api/services/auth";
import { refreshSession, setOnSessionExpired } from "@/api/client";
import { tokenStore } from "@/api/tokenStore";
import { syncSavedFromServer, clearSaved } from "@/lib/favourites";
import { getChatSocket, disconnectChatSocket } from "@/api/socket";
import { isFirstLaunchSinceInstall } from "@/lib/firstLaunch";
import { Alert } from "@/lib/dialog";

type Status = "loading" | "authed" | "guest";

interface AuthContextValue {
  user: AuthUser | null;
  status: Status;
  isAuthed: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  signUp: (payload: SignupPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /**
   * Gate an account-based action for a guest browsing without signing in.
   * Returns true (and does nothing) if already signed in; otherwise prompts
   * to sign in / create an account and returns false so the caller aborts.
   * `action` fills "Create a free account or sign in to {action}." — pass a
   * verb phrase like "save this home" or "message this agent".
   */
  requireAuth: (action?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Bootstrap: try to recover a session from the stored refresh token.
  useEffect(() => {
    let mounted = true;
    (async () => {
      // On a brand-new install, discard any session token the keychain carried
      // over from a previous install. Without this, expo-secure-store can
      // silently restore an old session (the iOS Keychain survives uninstalls),
      // sending a returning agent straight to their home and skipping the
      // welcome / login / sign-up flow.
      if (isFirstLaunchSinceInstall()) {
        await tokenStore.clear();
      }
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

  // When a mid-session refresh fails, drop the user to logged-out AND send them
  // to login. Otherwise they're stranded on an authed screen where every
  // request silently 401s (e.g. "Unauthorized" when uploading a photo).
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setStatus("guest");
      clearSaved();
      disconnectChatSocket();
      router.replace("/login");
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

  const requireAuth = useCallback(
    (action?: string) => {
      if (status === "authed" && user) return true;
      Alert.alert(
        "Sign in required",
        action
          ? `Create a free account or sign in to ${action}.`
          : "Create a free account or sign in to continue.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Sign in", onPress: () => router.push("/login" as Href) },
          {
            text: "Create account",
            onPress: () => router.push("/intro" as Href),
          },
        ],
      );
      return false;
    },
    [status, user],
  );

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
        requireAuth,
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
