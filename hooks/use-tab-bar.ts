import { Platform, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LINE = "#e1dcd3";

// Base height of the icon + label row, before the bottom inset is added.
const CONTENT_HEIGHT = 54;
// Breathing room above the system nav area so glyphs don't hug the divider.
const TOP_PAD = 8;
const EXTRA = 6;

/**
 * Shared bottom-tab-bar geometry for all three tab layouts (buyer / agent /
 * vendor).
 *
 * The app runs edge-to-edge on Android (`android.edgeToEdgeEnabled` in
 * app.json), so the app paints *behind* the system navigation bar. The bar must
 * therefore reserve `insets.bottom` at the bottom, or the 3-button nav (≈48dp)
 * sits on top of the tab icons. iPhones with a home indicator report a smaller
 * inset; older Android with on-screen-but-not-edge-to-edge nav reports 0.
 *
 * `insets.bottom` carries the real nav-bar height once the safe-area provider
 * has measured — use it verbatim when present (correct for both gesture and
 * 3-button nav, and for the iPhone home indicator). The one failure mode is
 * Android reporting 0 under edge-to-edge: that means the inset hasn't resolved,
 * so we assume the tallest common system bar (3-button ≈ 48dp) rather than let
 * the buttons tuck under the tabs. iOS reporting 0 is genuine (no nav bar).
 */
// Standard Android 3-button navigation bar height (dp) — the safe fallback.
const ANDROID_NAV_FALLBACK = 48;

export function useTabBarStyle(
  background = "#ffffff",
): { tabBarStyle: ViewStyle; bottomInset: number } {
  const insets = useSafeAreaInsets();

  const bottomInset =
    insets.bottom > 0
      ? insets.bottom
      : Platform.OS === "android"
        ? ANDROID_NAV_FALLBACK
        : 0;
  const bottomPad = bottomInset + EXTRA;

  return {
    bottomInset,
    tabBarStyle: {
      backgroundColor: background,
      borderTopWidth: 0.5,
      borderTopColor: LINE,
      height: CONTENT_HEIGHT + bottomPad,
      paddingTop: TOP_PAD,
      paddingBottom: bottomPad,
    },
  };
}
