// Phone notifications.
//
// The backend has pushed for a while: notify() sends every notification it
// stores to whatever push tokens the user has (notifications.service ->
// ExpoPushService). Nothing ever registered a token, so there was nobody to
// send to. This is that missing half — ask permission, hand the token to the
// backend, and route a tapped notification to the screen it belongs to.
//
// Every failure here is swallowed on purpose. Simulators have no push, Expo Go
// dropped remote push in SDK 53, and permission can simply be refused. None of
// that should interrupt someone using the app.
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { router, useRootNavigationState, type Href } from "expo-router";
import notificationsService from "@/api/services/notifications";
import { hrefForNotification } from "@/lib/notificationRoutes";

/** Kept so sign-out can tell the backend which token to drop. */
const TOKEN_KEY = "pl_push_token_v1";
const ANDROID_CHANNEL = "default";

/**
 * How a notification behaves while the app is open. Call once at startup,
 * before anything can arrive.
 *
 * SDK 54 replaced shouldShowAlert with the banner/list pair — a handler still
 * returning the old key shows nothing at all on iOS.
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  // Android 13 won't hand out a push token until a channel exists, so this has
  // to happen before getExpoPushTokenAsync, not after.
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#1f6f43",
  });
}

/**
 * Ask for permission if needed, then register this device with the backend.
 * Safe to call on every launch: the token is stable per install, and the
 * backend keys on it.
 */
export async function registerPushToken(): Promise<void> {
  try {
    await ensureAndroidChannel();

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted && current.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    // Refused, or refused permanently — nothing to register, and asking again
    // would only nag.
    if (!granted) return;

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas
        ?.projectId ?? Constants.easConfig?.projectId;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!token) return;

    await notificationsService.registerPushToken(
      token,
      Platform.OS === "ios" ? "ios" : "android",
    );
    await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
  } catch {
    /* no push here — simulator, Expo Go, or permission refused */
  }
}

/**
 * Drop this device's token on sign-out, so the next person to use the phone
 * doesn't receive the previous account's notifications.
 */
export async function unregisterPushToken(): Promise<void> {
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) await notificationsService.removePushToken(token);
  } catch {
    /* best effort — the backend prunes dead tokens when a send fails */
  } finally {
    if (token) await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  }
}

/**
 * Registers while signed in, and opens the right screen when a notification is
 * tapped — whether the app was running or launched by the tap.
 */
export function usePushNotifications(authed: boolean, role?: string) {
  // undefined while pending, null when the app wasn't opened from one.
  const lastResponse = Notifications.useLastNotificationResponse();
  const navState = useRootNavigationState();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!authed) return;
    void registerPushToken();
  }, [authed]);

  useEffect(() => {
    if (!authed || !lastResponse) return;
    // Navigating before the tree is mounted throws the route away.
    if (!navState?.key) return;

    const { identifier } = lastResponse.notification.request;
    if (handled.current === identifier) return;
    handled.current = identifier;

    const data = lastResponse.notification.request.content.data as Record<
      string,
      unknown
    >;
    // Anything without its own destination still opens the list, so a tap is
    // never a no-op.
    router.push(hrefForNotification(data, role) ?? ("/notifications" as Href));
  }, [authed, lastResponse, navState?.key, role]);
}
