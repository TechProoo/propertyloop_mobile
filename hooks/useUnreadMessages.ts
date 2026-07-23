import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import messagesService from "@/api/services/messages";
import { useAuth } from "@/context/auth";

/**
 * Total unread chat count for the signed-in user, kept fresh with a light poll
 * plus a refresh whenever the app returns to the foreground. Drives the badge
 * on the Inbox tab so new chats are visible without opening the inbox.
 *
 * Inert for a guest: messaging is account-based, and this polls on a timer, so
 * leaving it running while browsing signed-out would fire a doomed authed
 * request every 30 seconds.
 */
export function useUnreadMessages(pollMs = 30_000): number {
  const { status } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    messagesService
      .unreadCount()
      .then((r) => setUnread(r.unread ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "authed") {
      setUnread(0);
      return;
    }
    refresh();
    const timer = setInterval(refresh, pollMs);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh, pollMs, status]);

  return unread;
}
