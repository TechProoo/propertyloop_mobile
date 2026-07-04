import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import messagesService from "@/api/services/messages";

/**
 * Total unread chat count for the signed-in user, kept fresh with a light poll
 * plus a refresh whenever the app returns to the foreground. Drives the badge
 * on the Inbox tab so new chats are visible without opening the inbox.
 */
export function useUnreadMessages(pollMs = 30_000): number {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    messagesService
      .unreadCount()
      .then((r) => setUnread(r.unread ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, pollMs);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh, pollMs]);

  return unread;
}
