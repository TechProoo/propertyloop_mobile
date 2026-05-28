import { Text, View } from "react-native";

/**
 * Brand wordmark — "property" + emerald "loop". Used in app chrome,
 * headers, and credential cards. Mirrors PLWordmark in the design
 * bundle's primitives.jsx.
 *
 * Sizes correspond to common positions:
 *   - sm  (14px) — in-card credential, footer
 *   - md  (16px) — default for headers
 *   - lg  (20px) — landing / large hero
 *
 * Pass `color` to override the dark half (e.g. "white" on dark hero).
 */
type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = { sm: 14, md: 16, lg: 20 };

export function PLWordmark({
  size = "md",
  color = "#1a2120",
}: {
  size?: Size;
  color?: string;
}) {
  const px = SIZE_PX[size];
  return (
    <View className="flex-row items-baseline">
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: px,
          color,
          letterSpacing: -0.4,
        }}
      >
        property
      </Text>
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: px,
          color: "#1f6f43",
          letterSpacing: -0.4,
        }}
      >
        loop
      </Text>
    </View>
  );
}
