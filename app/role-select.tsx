import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "BUYER" | "AGENT" | "VENDOR";

const ROLES: {
  id: Role;
  title: string;
  desc: string;
  glyph: string;
}[] = [
  {
    id: "BUYER",
    title: "I'm looking for a home",
    desc: "Browse verified listings, save favourites, message agents directly.",
    glyph: "🏠",
  },
  {
    id: "AGENT",
    title: "I'm a real estate agent",
    desc: "Reach verified buyers and renters. List properties and manage enquiries.",
    glyph: "🔑",
  },
  {
    id: "VENDOR",
    title: "I offer property services",
    desc: "Get hired for repairs, maintenance, and upgrades from verified owners.",
    glyph: "🛠️",
  },
];

export default function RoleSelectScreen() {
  const choose = (role: Role) => {
    // Buyers get a feed-tailoring step first; agents & vendors go straight
    // to signup since their role-specific fields are collected there.
    if (role === "BUYER") {
      router.push("/buyer-preferences" as Href);
    } else {
      router.push({ pathname: "/signup", params: { role } } as Href);
    }
  };

  return (
    <View className="flex-1 bg-[#f5f0eb]">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-slate-700 text-xl">‹</Text>
          </Pressable>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 110, height: 28 }}
            contentFit="contain"
          />
          <View style={{ width: 24 }} />
        </View>

        <View className="px-5 mt-8">
          <Text className="text-emerald-700 text-[11px] font-bold tracking-[1.5px]">
            ONE QUICK QUESTION
          </Text>
          <Text className="text-slate-900 font-serif text-3xl mt-3 leading-[36px]">
            How will you use{"\n"}
            <Text className="italic">PropertyLoop</Text>?
          </Text>
          <Text className="text-slate-500 text-sm mt-3 leading-5">
            Pick the one that fits best. You can switch roles later from
            settings.
          </Text>
        </View>

        <View className="px-5 mt-8 gap-3">
          {ROLES.map((role) => (
            <Pressable
              key={role.id}
              onPress={() => choose(role.id)}
              className="bg-white border border-slate-200 rounded-3xl p-5 flex-row items-center gap-4 active:opacity-80"
            >
              <View className="w-12 h-12 rounded-2xl bg-emerald-50 items-center justify-center">
                <Text className="text-2xl">{role.glyph}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 font-bold text-base">
                  {role.title}
                </Text>
                <Text className="text-slate-500 text-xs mt-0.5 leading-4">
                  {role.desc}
                </Text>
              </View>
              <Text className="text-slate-400 text-xl">›</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
