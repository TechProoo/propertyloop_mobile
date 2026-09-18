// Where a notification takes you when it's tapped.
//
// Shared by the in-app notifications list and a tapped push notification, so
// the same event lands on the same screen either way. The payload keys are the
// ones the backend documents in notifications/notification-types.ts.
import type { Href } from "expo-router";

type NotificationData = Record<string, unknown> | null | undefined;

/** Push payloads arrive as strings; treat anything else as absent. */
function id(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function hrefForNotification(
  data: NotificationData,
  role?: string,
): Href | null {
  const d = data ?? {};
  const isAgent = role === "AGENT";

  if (id(d.purchaseId)) return "/purchase-progress" as Href;

  // Offers: agents review and accept/counter/decline on their offers screen;
  // buyers track the offers they've made on the buyer offers screen. (Routing
  // an agent to the buyer "/offers" screen showed an empty list.)
  if (id(d.offerId)) return (isAgent ? "/agent-offers" : "/offers") as Href;

  // Viewings: agents accept/decline/reschedule from the Leads → Viewings tab;
  // buyers see their booked viewings on the Account tab.
  if (id(d.viewingId)) {
    return (isAgent ? "/(agent-tabs)/leads?tab=viewing" : "/(tabs)/account") as Href;
  }

  // Withdrawal decisions land the vendor on their earnings tab, where the
  // paid/returned balance is visible.
  if (id(d.withdrawalId)) return "/(vendor-tabs)/earnings" as Href;

  // Job events route to the recipient's own job screen: the vendor's
  // active-job view (surfaces the dispute banner), or the buyer's service-job
  // view (where they confirm/release escrow).
  const jobId = id(d.jobId);
  if (jobId) {
    return (
      role === "VENDOR"
        ? `/vendor-active-job/${jobId}`
        : `/service-job/${jobId}`
    ) as Href;
  }

  return null;
}
