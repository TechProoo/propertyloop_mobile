import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "@/lib/dialog";

/**
 * Account deletion is irreversible, so require a device-level confirmation in
 * addition to the explicit destructive-action dialogs in the UI. Prefer
 * biometrics where available, but never block deletion outright when they
 * aren't — a device with no Face ID/Touch ID/fingerprint enrolled (including,
 * critically, an App Store reviewer's test device) must still have a working
 * path to delete. Apple explicitly rejects account-deletion flows that are
 * "unnecessarily difficult" (guideline 5.1.1), and a hard block with no
 * fallback would make deletion outright impossible on such a device.
 */
export async function confirmAccountDeletion(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  if (!hasHardware || !isEnrolled) {
    return new Promise((resolve) => {
      Alert.alert(
        "Confirm account deletion",
        "This will permanently delete your PropertyLoop account, your listings, and your messages. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Delete permanently",
            style: "destructive",
            onPress: () => resolve(true),
          },
        ],
      );
    });
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirm account deletion",
    promptDescription: "Verify your identity to permanently delete your PropertyLoop account.",
    cancelLabel: "Cancel",
    fallbackLabel: "Use device passcode",
    biometricsSecurityLevel: "strong",
    requireConfirmation: true,
  });

  return result.success;
}
