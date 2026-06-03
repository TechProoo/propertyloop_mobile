// Thin wrapper around expo-haptics so call sites stay one-liners and we
// never fire on web (where the native module is a no-op that logs warnings).
// Every call is fire-and-forget — a failed haptic must never break a tap.
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const NATIVE = Platform.OS === "ios" || Platform.OS === "android";

/** Light tap — saves, chip selection, card presses. */
export function tapLight() {
  if (NATIVE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — primary CTAs (Schedule visit, Make an offer). */
export function tapMedium() {
  if (NATIVE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Selection tick — moving between segmented chips. */
export function tapSelection() {
  if (NATIVE) Haptics.selectionAsync().catch(() => {});
}

/** Success notification — a save lands, an action completes. */
export function tapSuccess() {
  if (NATIVE)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
