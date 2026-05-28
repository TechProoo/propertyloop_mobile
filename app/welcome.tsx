import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Logo — vertically centered in the upper half */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 520, height: 103 }}
            contentFit="contain"
          />
        </View>

        {/* Content block */}
        <View className="px-6 pb-6">
          <Text className="text-emerald-400 text-xs font-semibold tracking-[2px] mb-4">
            GET STARTED TODAY
          </Text>

          <Text className="text-white font-serif text-5xl leading-[52px]">
            Find your{"\n"}next home.{"\n"}
            <Text className="text-emerald-400">Close the loop.</Text>
          </Text>

          <Text className="text-slate-400 text-base mt-5 leading-6">
            From first search to signed contract — and everything after the keys
            are handed over.
          </Text>

          {/* Primary CTA */}
          <Pressable
            onPress={() => router.push("/intro" as Href)}
            className="mt-8 bg-white rounded-full py-4 items-center active:opacity-80"
          >
            <Text className="text-slate-950 font-semibold text-base">
              Get started
            </Text>
          </Pressable>

          {/* Secondary CTA */}
          <Pressable
            onPress={() => router.push("/(tabs)" as Href)}
            className="mt-3 bg-slate-900 border border-slate-700 rounded-full py-4 items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">
              I already have an account
            </Text>
          </Pressable>

          <Text className="text-slate-500 text-xs text-center mt-5">
            By continuing you agree to our Terms · Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
