import { Image } from "expo-image";
import { Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appear, PressableScale } from "@/components/anim";
import { tapMedium, tapLight } from "@/lib/haptics";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Logo — vertically centered in the upper half, fading up on entry */}
        <View className="flex-1 items-center justify-center">
          <Appear from="fade" duration={700}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ width: 520, height: 103 }}
              contentFit="contain"
            />
          </Appear>
        </View>

        {/* Content block — copy cascades in, then the CTAs */}
        <View className="px-6 pb-6">
          <Appear delay={240}>
            <Text className="text-emerald-400 text-xs font-sans-semibold tracking-[2px] mb-4">
              GET STARTED TODAY
            </Text>
          </Appear>

          <Appear delay={340}>
            <Text className="text-white font-serif text-5xl leading-[52px]">
              Find your{"\n"}next home.{"\n"}
              <Text className="text-emerald-400">Close the loop.</Text>
            </Text>
          </Appear>

          <Appear delay={440}>
            <Text className="text-slate-400 text-base mt-5 leading-6">
              From first search to signed contract — and everything after the
              keys are handed over.
            </Text>
          </Appear>

          {/* Primary CTA */}
          <Appear delay={560}>
            <PressableScale
              onPress={() => {
                tapMedium();
                router.push("/intro" as Href);
              }}
              className="mt-8 bg-white rounded-full py-4 items-center"
            >
              <Text className="text-slate-950 font-sans-semibold text-base">
                Get started
              </Text>
            </PressableScale>
          </Appear>

          {/* Secondary CTA */}
          <Appear delay={640}>
            <PressableScale
              onPress={() => {
                tapLight();
                router.push("/login" as Href);
              }}
              className="mt-3 bg-slate-900 border border-slate-700 rounded-full py-4 items-center"
            >
              <Text className="text-white font-sans-semibold text-base">
                I already have an account
              </Text>
            </PressableScale>
          </Appear>

          <Appear delay={720} from="fade">
            <Text className="text-slate-500 text-xs text-center mt-5">
              By continuing you agree to our Terms · Privacy Policy
            </Text>
          </Appear>
        </View>
      </SafeAreaView>
    </View>
  );
}
