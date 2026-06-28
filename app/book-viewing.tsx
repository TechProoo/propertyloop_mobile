import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "@/lib/dialog";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import viewingsService from "@/api/services/viewings";
import type { Listing } from "@/api/types";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type Mode = "in-person" | "video";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const SLOTS = ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00"];
const DAYS_AHEAD = 14;

function buildDates(): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

export default function BookViewingScreen() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const { user } = useAuth();
  const dates = useMemo(buildDates, []);

  const [listing, setListing] = useState<Listing | null>(null);
  const [dateIdx, setDateIdx] = useState(0);
  const [slot, setSlot] = useState("10:00");
  const [mode, setMode] = useState<Mode>("in-person");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!listingId) return;
    let active = true;
    listingsService
      .getById(listingId)
      .then((l) => active && setListing(l))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [listingId]);

  const selectedDate = dates[dateIdx];

  const submit = async () => {
    if (!listingId) return;
    const phoneToUse = (user?.phone ?? "").trim() || phone.trim();
    if (!phoneToUse) {
      Alert.alert(
        "Add a phone number",
        "The agent needs a number to confirm your viewing.",
      );
      return;
    }
    const [hh, mm] = slot.split(":").map(Number);
    const when = new Date(selectedDate);
    when.setHours(hh, mm, 0, 0);

    setSubmitting(true);
    try {
      await viewingsService.create({
        listingId,
        scheduledFor: when.toISOString(),
        clientPhone: phoneToUse,
        notes:
          (mode === "video" ? "Video tour requested. " : "") + note.trim(),
      });
      Alert.alert(
        "Viewing requested",
        "The agent will confirm shortly. You'll be notified.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        "Couldn't request the viewing. Please try again.";
      Alert.alert("Request failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const needsPhone = !(user?.phone ?? "").trim();

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center gap-2.5 px-5 pt-1 pb-3">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
          >
            <Ionicons name="close" size={18} color={INK_2} />
          </Pressable>
          <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">
            Book a viewing
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Property mini-card */}
          <View
            className="flex-row gap-3 p-2.5 bg-white rounded-2xl items-center border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Image
              source={listing?.coverImage}
              style={{ width: 56, height: 56, borderRadius: 10 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
                {listing?.title ?? "Loading…"}
              </Text>
              <Text className="text-xs text-ink-3 mt-0.5" numberOfLines={1}>
                {listing
                  ? `${listing.priceLabel}${listing.period ?? ""} · ${listing.location}`
                  : ""}
              </Text>
            </View>
          </View>

          {/* Heading */}
          <Text
            className="font-serif text-ink"
            style={{ fontSize: 26, lineHeight: 28, marginTop: 22 }}
          >
            When works <Text className="font-serif-italic">for you</Text>?
          </Text>
          <Text className="text-[13px] text-ink-2 mt-1 leading-5">
            Pick a day and time — the agent confirms from their side.
          </Text>

          {/* Date row */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2">
            {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {dates.map((d, i) => {
              const selected = dateIdx === i;
              return (
                <Pressable
                  key={d.toISOString()}
                  onPress={() => setDateIdx(i)}
                  className={`rounded-2xl items-center border-line ${
                    selected ? "bg-ink" : "bg-white"
                  }`}
                  style={{
                    width: 56,
                    paddingVertical: 9,
                    borderWidth: selected ? 0 : 1,
                  }}
                >
                  <Text
                    className={`text-[10px] font-sans-bold tracking-wider uppercase ${
                      selected ? "text-white/70" : "text-ink/60"
                    }`}
                  >
                    {WEEKDAYS[d.getDay()]}
                  </Text>
                  <Text
                    className={`font-serif ${selected ? "text-white" : "text-ink"}`}
                    style={{ fontSize: 19, letterSpacing: -0.4 }}
                  >
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Slots */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2.5">
            Available times
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SLOTS.map((s) => {
              const selected = slot === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSlot(s)}
                  className={`rounded-xl items-center border-line ${
                    selected ? "bg-primary" : "bg-white"
                  }`}
                  style={{
                    width: "30.5%",
                    paddingVertical: 11,
                    borderWidth: selected ? 0 : 1,
                  }}
                >
                  <Text
                    className={`text-[14px] font-sans-bold ${
                      selected ? "text-white" : "text-ink"
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Mode */}
          <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2.5">
            How would you like to view?
          </Text>
          <View className="flex-row gap-2">
            <ModeCard
              label="In person"
              detail="Meet at the home"
              selected={mode === "in-person"}
              onPress={() => setMode("in-person")}
            />
            <ModeCard
              label="Video tour"
              detail="Live walkthrough on WhatsApp"
              selected={mode === "video"}
              onPress={() => setMode("video")}
            />
          </View>

          {/* Phone (only if profile has none) */}
          {needsPhone && (
            <>
              <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase mt-5 mb-2">
                Your phone number
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+234 80 1234 5678"
                placeholderTextColor={INK_3}
                keyboardType="phone-pad"
                className="bg-white border border-line rounded-2xl px-3.5 py-3.5 text-ink text-[15px]"
              />
            </>
          )}

          {/* Note */}
          <View className="flex-row items-baseline gap-1 mt-5 mb-2">
            <Text className="text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase">
              Note to agent
            </Text>
            <Text className="text-[13px] font-sans-medium text-ink-3 tracking-wider">
              · optional
            </Text>
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder='"Bringing my partner. Could we see the rooftop too?"'
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px]"
            style={{ minHeight: 70, fontFamily: "PlayfairDisplay_400Regular_Italic" }}
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 border-line"
          style={{
            backgroundColor: "rgba(245,240,235,0.96)",
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 20) + 10,
          }}
        >
          <Pressable
            disabled={submitting}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 17, opacity: submitting ? 0.6 : 1 }}
            onPress={submit}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {submitting
                ? "Requesting…"
                : `Request viewing · ${WEEKDAYS[selectedDate.getDay()]} ${selectedDate.getDate()}, ${slot}`}
            </Text>
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-1.5">
            You&apos;ll get a confirmation from the agent
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeCard({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-2xl px-3 py-3 ${
        selected ? "bg-primary-soft" : "bg-white"
      }`}
      style={{
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? PRIMARY : "#e1dcd3",
      }}
    >
      <Text className="text-[13px] font-sans-bold text-ink">{label}</Text>
      <Text className="text-[11px] text-ink-3 mt-0.5 leading-4">{detail}</Text>
    </Pressable>
  );
}
