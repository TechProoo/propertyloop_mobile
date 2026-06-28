import {
  Pressable,
  Text,
} from "react-native";
import { Alert } from "@/lib/dialog";

/**
 * Primary onboarding button that is ALWAYS tappable.
 *
 * When the step isn't complete it shows a muted style and, on tap, an alert
 * naming exactly what's missing — instead of a dead, greyed-out button that
 * silently does nothing. Pass `getMissing` to list the outstanding fields.
 */
export default function OnboardingCta({
  label,
  ready,
  onPress,
  getMissing,
  loading = false,
  loadingLabel = "Please wait…",
}: {
  label: string;
  ready: boolean;
  onPress: () => void;
  getMissing?: () => string[];
  loading?: boolean;
  loadingLabel?: string;
}) {
  const handlePress = () => {
    if (loading) return;
    if (!ready) {
      const missing = getMissing?.().filter(Boolean) ?? [];
      Alert.alert(
        "Almost there",
        missing.length
          ? `Please add ${missing.join(", ")} to continue.`
          : "Please complete the required fields to continue.",
      );
      return;
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-primary rounded-full items-center active:opacity-80"
      style={{ paddingVertical: 16, opacity: ready && !loading ? 1 : 0.5 }}
    >
      <Text className="text-white font-sans-semibold text-base">
        {loading ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}
