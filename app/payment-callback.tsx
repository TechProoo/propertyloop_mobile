import { useEffect } from "react";
import { Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Appear } from "@/components/anim";

const PRIMARY = "#1f6f43";

/**
 * Deep-link landing for the in-app Paystack checkout. Paystack redirects to
 * `propertyloopmobile://payment-callback`; without this route the app showed an
 * "Unmatched Route" screen. Verification of the charge happens back on the
 * service-job screen (it self-heals on focus), so this screen just shows a brief
 * branded confirmation and returns the user to where they were.
 */
export default function PaymentCallbackScreen() {
  useEffect(() => {
    const t = setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/");
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <View className="flex-1 bg-cream items-center justify-center px-8">
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <Appear from="fade">
        <View
          className="rounded-full items-center justify-center"
          style={{ width: 76, height: 76, backgroundColor: "#e3efe7" }}
        >
          <Ionicons name="shield-checkmark" size={36} color={PRIMARY} />
        </View>
      </Appear>
      <Appear delay={120}>
        <Text
          className="font-serif text-ink text-center mt-5"
          style={{ fontSize: 24, letterSpacing: -0.5 }}
        >
          Payment <Text className="font-serif-italic">received</Text>
        </Text>
        <Text className="text-ink-2 text-[14px] text-center mt-2 leading-5">
          Your money is safe in escrow. Taking you back to your job…
        </Text>
      </Appear>
    </View>
  );
}
