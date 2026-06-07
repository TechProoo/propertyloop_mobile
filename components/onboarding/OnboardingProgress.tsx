import { Text, View } from "react-native";

const PRIMARY = "#1f6f43";
const TRACK = "#e1dcd3";

/**
 * Segmented progress bar for multi-step onboarding flows.
 * Shows `total` segments filled up to `step`, plus a "Step X of N" label.
 */
export default function OnboardingProgress({
  step,
  total,
  className,
}: {
  step: number;
  total: number;
  className?: string;
}) {
  return (
    <View className={className}>
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: i < step ? PRIMARY : TRACK }}
          />
        ))}
      </View>
      <Text className="text-ink-3 text-[11px] font-sans-medium mt-1.5">
        Step {step} of {total}
      </Text>
    </View>
  );
}
