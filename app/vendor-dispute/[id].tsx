import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { DISPUTE } from "@/mocks/vendor";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const DISPUTE_BG = "#fdf3eb";
const DISPUTE_BORDER = "#e4a87e";
const DISPUTE_FG = "#7a3a13";
const DISPUTE_PILL = "#c05a1f";

export default function VendorDisputeScreen() {
  useLocalSearchParams<{ id?: string }>();
  const d = DISPUTE;

  const [reply, setReply] = useState(
    "Both bathrooms were cleaned — here are my completion photos timestamped at 2:40pm. The guest bath door was locked on arrival; I noted this in chat.",
  );
  const [photos, setPhotos] = useState<string[]>([]);

  const pickEvidence = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 6 - photos.length,
      quality: 0.85,
    });
    if (!r.canceled) {
      setPhotos((p) => [...p, ...r.assets.map((a) => a.uri)].slice(0, 6));
    }
  };

  const submit = () => {
    Alert.alert(
      "Response submitted",
      "Our team will review the evidence from both sides and decide within 48 hours.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  const partial = () =>
    Alert.alert(
      "Offer partial refund",
      "Choose how much to refund. The customer can accept it and the rest releases to you.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Refund ₦7,000" },
        { text: "Refund ₦15,000" },
      ],
    );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={18} color={INK_2} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[14px] font-sans-bold text-ink">Dispute</Text>
          <Text className="text-[11px] font-sans-semibold text-ink-3 mt-0.5">
            Job {d.jobRef}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        <View
          className="rounded-2xl px-4 py-3.5"
          style={{ backgroundColor: DISPUTE_BG, borderWidth: 1, borderColor: DISPUTE_BORDER }}
        >
          <View className="flex-row items-center gap-2">
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: DISPUTE_PILL }}>
              <Text className="text-[10px] font-sans-bold text-white tracking-widest uppercase">
                Open dispute
              </Text>
            </View>
            <Text className="text-[11px] font-sans-bold" style={{ color: DISPUTE_FG }}>
              {d.amountHeld} on hold
            </Text>
          </View>
          <Text
            className="font-serif mt-2"
            style={{ fontSize: 19, letterSpacing: -0.3, lineHeight: 22, color: DISPUTE_FG }}
          >
            Customer says the <Text className="font-serif-italic">job's incomplete</Text>
          </Text>
          <Text className="text-[12.5px] mt-1 leading-5" style={{ color: DISPUTE_FG }}>
            Respond with evidence within 48 hrs. Our team reviews both sides and decides the
            outcome.
          </Text>
          <Text className="text-[11px] font-sans-bold mt-2.5" style={{ color: DISPUTE_FG }}>
            ⏱ {d.hoursLeft} hrs left to respond
          </Text>
        </View>

        {/* Job summary */}
        <View
          className="mt-3.5 bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <PLAvatar
            initials={d.customer.initials}
            size={40}
            tone={d.customer.tone}
          />
          <View className="flex-1">
            <Text className="text-[13px] font-sans-bold text-ink">
              {d.customer.name} · {d.service}
            </Text>
            <Text className="text-[11.5px] text-ink-3">
              {d.date} · {d.property} · {d.amountTotal}
            </Text>
          </View>
        </View>

        {/* Conversation */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
          Conversation
        </Text>
        <View className="gap-2">
          {d.thread.map((m) =>
            m.who === "system" ? (
              <View
                key={m.id}
                className="self-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: "#e3efe7" }}
              >
                <Text
                  className="text-[11px] font-sans-bold"
                  style={{ color: "#134a2d" }}
                >
                  {m.body}
                </Text>
              </View>
            ) : (
              <View
                key={m.id}
                className="self-start rounded-2xl px-3.5 py-2.5"
                style={{
                  backgroundColor: "#ece6df",
                  maxWidth: "85%",
                  borderBottomLeftRadius: 4,
                }}
              >
                <Text className="text-[10.5px] font-sans-bold text-ink-3 mb-1">
                  {m.author.toUpperCase()}
                </Text>
                <Text className="text-[13.5px] text-ink leading-5">{m.body}</Text>
                {m.photos && m.photos > 0 && (
                  <View className="flex-row gap-1.5 mt-2">
                    {Array.from({ length: m.photos }).map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 48, height: 48, borderRadius: 8,
                          backgroundColor: "#d3cdc1",
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            ),
          )}
        </View>

        {/* Your response */}
        <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-2">
          Your response
        </Text>
        <TextInput
          value={reply}
          onChangeText={setReply}
          multiline
          textAlignVertical="top"
          placeholder="Explain what happened. Be specific."
          placeholderTextColor={INK_3}
          className="bg-white border border-line rounded-2xl px-4 py-3 text-ink-2 text-[14px]"
          style={{ minHeight: 90, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
        />

        {/* Evidence photos */}
        <View className="flex-row flex-wrap gap-1.5 mt-3">
          {photos.map((uri) => (
            <View key={uri} className="relative" style={{ width: "23.5%" }}>
              <Image
                source={{ uri }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white items-center justify-center"
                hitSlop={6}
                style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
              >
                <Ionicons name="close" size={10} color={INK_2} />
              </Pressable>
            </View>
          ))}
          {photos.length < 6 && (
            <Pressable
              onPress={pickEvidence}
              className="items-center justify-center"
              style={{
                width: "23.5%",
                aspectRatio: 1,
                borderRadius: 10,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: "#d3cdc1",
              }}
            >
              <Ionicons name="add" size={18} color={INK_2} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
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
          onPress={submit}
          className="bg-primary rounded-full items-center active:opacity-80"
          style={{ paddingVertical: 16 }}
        >
          <Text className="text-white font-sans-bold text-[15px]">
            Submit response & evidence
          </Text>
        </Pressable>
        <Pressable onPress={partial} hitSlop={6} className="items-center mt-2.5">
          <Text className="text-[12.5px] font-sans-bold text-ink-3">
            Offer partial refund instead
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
