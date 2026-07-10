import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "@/lib/dialog";

/**
 * Account deletion is irreversible, so require a device-level confirmation in
 * addition to the explicit destructive-action dialogs in the UI.
 */
export async function confirmAccountDeletion(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  if (!hasHardware || !isEnrolled) {
    Alert.alert(
      "Biometric confirmation required",
      "Set up Face ID, Touch ID, or fingerprint authentication on this device before permanently deleting your account.",
    );
    return false;
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
