import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type IonName = keyof typeof Ionicons.glyphMap;

/**
 * Empty-state scaffold for tabs not yet built. Brand-aligned so the app
 * doesn't look broken when a user lands on an unfinished tab.
 */
export function TabPlaceholder({
  icon,
  eyebrow,
  title,
  italic,
  body,
}: {
  icon: IonName;
  eyebrow: string;
  title: string;
  italic?: string;
  body: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-16 h-16 rounded-full bg-primary-soft items-center justify-center mb-5">
          <Ionicons name={icon} size={28} color="#1f6f43" />
        </View>
        <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
          {eyebrow}
        </Text>
        <Text
          className="font-serif text-[28px] text-ink mt-2 text-center"
          style={{ lineHeight: 32 }}
        >
          {title}
          {italic ? (
            <>
              {" "}
              <Text className="font-serif-italic">{italic}</Text>
            </>
          ) : null}
        </Text>
        <Text className="text-[14px] text-ink-3 mt-3 text-center leading-5">
          {body}
        </Text>
      </View>
    </SafeAreaView>
  );
}
