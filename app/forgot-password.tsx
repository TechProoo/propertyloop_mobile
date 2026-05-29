import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";

type MethodId = "sms" | "email" | "support";

type Method = {
  id: MethodId;
  title: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const METHODS: Method[] = [
  { id: "sms",     title: "Text me a code",   detail: "to +234 80 •••• 5678", icon: "chatbox-outline" },
  { id: "email",   title: "Email a link",     detail: "to a••••@gmail.com",    icon: "mail-outline" },
  { id: "support", title: "Contact support",  detail: "Reply within 1 hr",     icon: "chatbubble-outline" },
];

export default function ForgotPasswordScreen() {
  const [selected, setSelected] = useState<MethodId>("sms");

  const handleSend = () => {
    Alert.alert(
      "Reset code sent",
      `We've sent your reset ${selected === "email" ? "link" : "code"}. Check ${
        selected === "email" ? "your inbox" : "your messages"
      }.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-[13px] font-sans-bold text-ink-3">Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Lock badge */}
        <View
          className="w-14 h-14 rounded-[16px] bg-primary-soft items-center justify-center"
        >
          <Ionicons name="lock-closed-outline" size={26} color={PRIMARY_INK} />
        </View>

        {/* Heading + subtitle */}
        <Text
          className="font-serif text-ink mt-5"
          style={{ fontSize: 30, lineHeight: 32, letterSpacing: -0.6 }}
        >
          Reset your{" "}
          <Text className="font-serif-italic">password</Text>
        </Text>
        <Text className="text-[14px] text-ink-2 mt-2 leading-5">
          Where should we send your reset link? Pick whichever's closest at
          hand.
        </Text>

        {/* Method cards */}
        <View className="mt-6 gap-2.5">
          {METHODS.map((m) => {
            const isOn = selected === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setSelected(m.id)}
                className="flex-row items-center gap-3.5 rounded-2xl px-4 py-3.5 bg-white active:opacity-90"
                style={{
                  borderWidth: isOn ? 1.5 : 1,
                  borderColor: isOn ? PRIMARY : "#e1dcd3",
                }}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    isOn ? "bg-primary-soft" : "bg-cream-2"
                  }`}
                >
                  <Ionicons
                    name={m.icon}
                    size={20}
                    color={isOn ? PRIMARY_INK : INK_2}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[14.5px] font-sans-bold text-ink">
                    {m.title}
                  </Text>
                  <Text className="text-xs text-ink-3 mt-0.5">{m.detail}</Text>
                </View>
                <View
                  className="w-[22px] h-[22px] rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isOn ? PRIMARY : "transparent",
                    borderWidth: isOn ? 0 : 1.5,
                    borderColor: "#e1dcd3",
                  }}
                >
                  {isOn && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 8,
                        backgroundColor: "white",
                      }}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Security notice */}
        <Text className="text-xs text-ink-3 mt-5 leading-5">
          For your security, we'll sign you out from all devices once your
          password is reset.
        </Text>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="px-5 pb-8 pt-2">
        <Pressable
          onPress={handleSend}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 17 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            {selected === "email" ? "Send reset link" : "Send reset code"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
