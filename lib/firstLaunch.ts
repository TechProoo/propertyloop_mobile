// Detects the very first launch after a fresh install.
//
// Why a marker file and not expo-secure-store: SecureStore is backed by the
// iOS Keychain / Android Keystore, which can OUTLIVE an app uninstall (iOS
// Keychain notably survives deletion; Android can restore it via Auto Backup).
// A file in the app's document directory, by contrast, is wiped when the app is
// uninstalled — so its absence is a reliable "this is a brand-new install"
// signal that lets us tell a fresh install apart from an ordinary app restart.
import { File, Paths } from "expo-file-system";

const MARKER_NAME = "pl_installed.marker";

/**
 * Returns `true` only on the first call after a fresh install, then `false` on
 * every subsequent launch. The check is one-shot: the marker is written the
 * first time this runs, so callers get exactly one chance to react to a fresh
 * install (e.g. clearing a stale session that the keychain carried over).
 *
 * Fails closed — if the filesystem can't be reached for any reason we report
 * "not first launch" so we never wrongly discard a valid returning session.
 */
export function isFirstLaunchSinceInstall(): boolean {
  try {
    const marker = new File(Paths.document, MARKER_NAME);
    if (marker.exists) return false;
    marker.create();
    return true;
  } catch {
    return false;
  }
}
