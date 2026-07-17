import { Linking, Platform, Pressable, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const WEBSITE_URL = "https://propertyloop.ng/account/billing";

/**
 * No payment is ever collected in the app outside of escrow (funding a
 * vendor-job booking). This screen used to capture raw card details directly
 * — it never had a real backend behind it, and collecting card numbers/CVV
 * in-app for anything other than escrow checkout is exactly what we don't
 * do. Payment methods / billing are managed on the website instead.
 */
export default function AddCardScreen() {
  const insets = useSafeAreaInsets();
  // App Store 3.1.1 — the iOS app never points users to the website for
  // billing. Android may show the link.
  const showWebsite = Platform.OS !== "ios";

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="close" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">Payment methods</Text>
        <View style={{ width: 36 }} />
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: "#e3efe7" }}
        >
          <Ionicons name="globe-outline" size={28} color={PRIMARY} />
        </View>
        {showWebsite ? (
          <>
            <Text className="font-serif text-ink text-center mt-5" style={{ fontSize: 22 }}>
              Manage this on the <Text className="font-serif-italic">website</Text>
            </Text>
            <Text className="text-[13.5px] text-ink-3 text-center mt-2 leading-5">
              Escrow for service bookings is the only payment the app handles. Cards and
              billing details are managed securely at propertyloop.ng — visit the website
              for more information.
            </Text>
          </>
        ) : (
          <>
            <Text className="font-serif text-ink text-center mt-5" style={{ fontSize: 22 }}>
              No saved cards <Text className="font-serif-italic">needed</Text>
            </Text>
            <Text className="text-[13.5px] text-ink-3 text-center mt-2 leading-5">
              Escrow for service bookings is the only payment the app handles, and
              it&apos;s completed securely at checkout each time — nothing is stored here.
            </Text>
          </>
        )}
      </View>

      {/* Sticky CTA */}
      {showWebsite && (
        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          }}
        >
          <Pressable
            onPress={() => Linking.openURL(WEBSITE_URL)}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 16 }}
          >
            <Text className="text-white font-sans-bold text-[15px]">Visit propertyloop.ng</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
