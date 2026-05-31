import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SIGN_DOCUMENT } from "@/mocks/linked";

const PRIMARY = "#1f6f43";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

export default function SignDocumentScreen() {
  const d = SIGN_DOCUMENT;
  const [signed, setSigned] = useState(true);
  const [consent, setConsent] = useState(true);

  const onSubmit = () => {
    if (!signed || !consent) {
      Alert.alert(
        "Almost there",
        "Sign the document and tick the consent box to submit.",
      );
      return;
    }
    Alert.alert(
      "Signed",
      "Your signed authorisation has been submitted. The conveyancer will be notified.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="close" size={18} color={INK_2} />
        </Pressable>
        <Pressable hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={INK_2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Doc meta */}
        <View
          className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <View className="w-11 h-11 rounded-xl bg-primary-soft items-center justify-center">
            <Ionicons name="document-text" size={20} color={PRIMARY} />
          </View>
          <View className="flex-1">
            <Text className="text-[13.5px] font-sans-bold text-ink">
              {d.title}
            </Text>
            <Text className="text-[11.5px] text-ink-3 mt-0.5">
              {d.property} · {d.pages} pages · PDF
            </Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: "#f5ead4" }}
          >
            <Text
              className="text-[10.5px] font-sans-bold tracking-wider uppercase"
              style={{ color: "#6b4a16" }}
            >
              {d.due}
            </Text>
          </View>
        </View>

        {/* PDF preview */}
        <View
          className="mt-4 bg-white rounded-2xl p-5 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <View className="flex-row items-center gap-2 pb-3 border-line"
            style={{ borderBottomWidth: 0.5 }}
          >
            <View className="w-6 h-6 rounded-md bg-primary items-center justify-center">
              <Text className="text-white font-sans-bold text-[10px]">PL</Text>
            </View>
            <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
              PropertyLoop
            </Text>
          </View>
          <Text
            className="font-serif text-ink mt-3"
            style={{ fontSize: 18, lineHeight: 22 }}
          >
            Authorisation to conduct title search
          </Text>
          {d.body.map((p, i) => (
            <Text
              key={i}
              className="text-[12.5px] text-ink-2 mt-3 leading-5"
            >
              {p}
            </Text>
          ))}
          <Text className="text-[11px] text-ink-3 text-center mt-4">
            Page 1 of {d.pages}
          </Text>
        </View>

        {/* Signature pad */}
        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase">
            Your signature
          </Text>
          <Pressable hitSlop={6} onPress={() => setSigned(false)}>
            <Text className="text-[12px] font-sans-bold text-primary">
              Clear
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setSigned(true)}
          className="mt-1.5 bg-white items-center justify-center active:opacity-90"
          style={{
            height: 110,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: signed ? INK : "#d3cdc1",
            borderStyle: signed ? "solid" : "dashed",
          }}
        >
          {signed ? (
            <Text
              className="font-serif-italic"
              style={{ fontSize: 32, color: INK, letterSpacing: -0.5 }}
            >
              {d.signerName}
            </Text>
          ) : (
            <Text className="text-[12px] text-ink-3 font-sans-semibold">
              Tap to sign with your finger
            </Text>
          )}
        </Pressable>
        <Text className="text-[11px] text-ink-3 mt-1.5">
          {d.signerName} · signed with finger
        </Text>

        {/* Consent */}
        <Pressable
          onPress={() => setConsent((c) => !c)}
          className="mt-5 rounded-2xl px-3.5 py-3 flex-row items-start gap-3 bg-cream-2 active:opacity-90"
        >
          <View
            className="w-5 h-5 rounded items-center justify-center mt-0.5"
            style={{
              backgroundColor: consent ? PRIMARY : "transparent",
              borderWidth: consent ? 0 : 1.5,
              borderColor: INK_3,
            }}
          >
            {consent && (
              <Ionicons name="checkmark" size={13} color="#ffffff" />
            )}
          </View>
          <Text className="flex-1 text-[12px] text-ink-2 leading-5">
            I confirm the information above is accurate and authorise
            PropertyLoop's conveyancer to act on my behalf for this title
            search.
          </Text>
        </Pressable>
      </ScrollView>

      {/* Sticky footer */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-cream border-line"
        style={{
          borderTopWidth: 0.5,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 28,
        }}
      >
        <Pressable
          onPress={onSubmit}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Sign & submit
          </Text>
        </Pressable>
        <View className="flex-row items-center justify-center gap-1.5 mt-2">
          <Ionicons name="shield-checkmark" size={11} color={INK_3} />
          <Text className="text-[11px] text-ink-3 font-sans-medium">
            Timestamped & encrypted · audit trail kept
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
