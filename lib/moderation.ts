// Shared report + block flows — App Store guideline 1.2 requires every app
// with user-generated content to offer both, so every surface that shows
// another user's content (a listing, a profile, a chat) wires into these two
// functions rather than rolling its own prompt.
import { router, type Href } from "expo-router";
import { Alert } from "./dialog";
import reportsService, { type ReportTargetType } from "@/api/services/reports";
import blocksService from "@/api/services/blocks";

const REASONS = [
  "Spam or scam",
  "Harassment or abuse",
  "Inappropriate or objectionable content",
  "Fake listing or profile",
  "Something else",
] as const;

/** Prompt the user to pick a reason, then file the report. */
export function reportContent(
  targetType: ReportTargetType,
  targetId: string,
  label = "this",
) {
  Alert.alert(
    `Report ${label}`,
    "What's wrong with it? We review every report and act within 24 hours.",
    [
      ...REASONS.map((reason) => ({
        text: reason,
        onPress: () => {
          reportsService
            .create({ targetType, targetId, reason })
            .then(() =>
              Alert.alert(
                "Report received",
                "Thanks — our team will review this within 24 hours.",
              ),
            )
            .catch(() =>
              Alert.alert(
                "Couldn't send report",
                "Please check your connection and try again.",
              ),
            );
        },
      })),
      { text: "Cancel", style: "cancel" },
    ],
  );
}

/**
 * Prompt to block a user. Blocking hides their content immediately (their
 * conversation disappears from the inbox and they can't message again) and
 * automatically files a report so the team reviews the account too.
 */
export function blockUser(
  userId: string,
  name: string,
  onBlocked?: () => void,
) {
  Alert.alert(
    `Block ${name}?`,
    `You won't see messages from ${name} again, and they won't be able to contact you. We'll also review their account.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: () => {
          blocksService
            .block(userId)
            .then(() => {
              onBlocked?.();
              Alert.alert("Blocked", `You won't hear from ${name} again.`);
            })
            .catch(() =>
              Alert.alert(
                "Couldn't block user",
                "Please check your connection and try again.",
              ),
            );
        },
      },
    ],
  );
}

/** Navigate to the signed-in user's blocked-users list. */
export function openBlockedUsers() {
  router.push("/blocked-users" as Href);
}
