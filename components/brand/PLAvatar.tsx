import { Text, View } from "react-native";
import { Image } from "expo-image";

/**
 * Initials avatar on a tinted background, with optional photo override.
 * Matches PLAvatar in the design bundle.
 *
 * Tones map to the brand palette:
 *   - primary → emerald soft / emerald ink
 *   - accent  → ochre soft / ochre ink
 *   - neutral → cream-2 / ink-2
 */
type Tone = "primary" | "accent" | "neutral";

const TONE_BG: Record<Tone, string> = {
  primary: "#e3efe7",
  accent: "#f5ead4",
  neutral: "#f0f0f0",
};

const TONE_FG: Record<Tone, string> = {
  primary: "#134a2d",
  accent: "#6b4a16",
  neutral: "#4d524f",
};

export function PLAvatar({
  initials,
  size = 40,
  tone = "primary",
  uri,
}: {
  initials: string;
  size?: number;
  tone?: Tone;
  uri?: string | null;
}) {
  if (uri) {
    return (
      <Image
        source={uri}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: TONE_BG[tone],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: size * 0.36,
          color: TONE_FG[tone],
          letterSpacing: 0.3,
        }}
      >
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}
