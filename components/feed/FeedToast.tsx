import { Text, View } from "react-native";

/** Mirrors the web FeedToast — a pill that sits above the bottom of the screen. */
export function FeedToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 bottom-10 items-center"
    >
      <View className="bg-ink px-5 py-3.5 rounded-full">
        <Text className="text-white text-sm font-sans-bold">{message}</Text>
      </View>
    </View>
  );
}
