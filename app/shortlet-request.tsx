import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import shortletsService from "@/api/services/shortlets";
import type { Listing } from "@/api/types";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAYS_AHEAD = 30;

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

function fmtDate(d: Date) {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

export default function ShortletRequestScreen() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const { user } = useAuth();
  const dates = useMemo(buildDates, []);

  const [listing, setListing] = useState<Listing | null>(null);
  const [checkInIdx, setCheckInIdx] = useState(0);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

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

  const checkIn = dates[checkInIdx];
  const checkOut = useMemo(() => {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + nights);
    return d;
  }, [checkIn, nights]);

  const nightly = listing?.priceNaira ?? 0;
  const subtotal = nightly * nights;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;
  const needsPhone = !(user?.phone ?? "").trim();

  const submit = async () => {
    if (!listingId) return;
    const phoneToUse = (user?.phone ?? "").trim() || phone.trim();
    if (!phoneToUse) {
      Alert.alert("Add a phone number", "The host needs a number to confirm.");
      return;
    }
    setSubmitting(true);
    try {
      await shortletsService.create({
        listingId,
        guests,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guestPhone: phoneToUse,
      });
      Alert.alert(
        "Request sent",
        "The host will confirm your stay shortly.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? "Couldn't request the stay. Try again.";
      Alert.alert("Request failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

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
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">
            Request to book
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Listing */}
          <View
            className="flex-row gap-3 p-3 bg-white rounded-2xl border-line"
            style={{ borderWidth: 0.5 }}
          >
            <Image
              source={listing?.coverImage}
              style={{ width: 70, height: 70, borderRadius: 12 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text
                className="text-[11px] font-sans-bold tracking-widest uppercase"
                style={{ color: PRIMARY }}
              >
                Shortlet
              </Text>
              <Text className="text-[14px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
                {listing?.title ?? "Loading…"}
              </Text>
              <Text className="text-xs text-ink-3" numberOfLines={1}>
                {listing ? `${listing.priceLabel} / night · ${listing.location}` : ""}
              </Text>
            </View>
          </View>

          {/* Check-in date */}
          <SectionLabel className="mt-5">Check-in</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
          >
            {dates.map((d, i) => {
              const on = checkInIdx === i;
              return (
                <Pressable
                  key={d.toISOString()}
                  onPress={() => setCheckInIdx(i)}
                  className={`rounded-2xl items-center border-line ${on ? "bg-ink" : "bg-white"}`}
                  style={{ width: 56, paddingVertical: 9, borderWidth: on ? 0 : 1 }}
                >
                  <Text
                    className={`text-[10px] font-sans-bold tracking-wider uppercase ${on ? "text-white/70" : "text-ink/60"}`}
                  >
                    {WEEKDAYS[d.getDay()]}
                  </Text>
                  <Text
                    className={`font-serif ${on ? "text-white" : "text-ink"}`}
                    style={{ fontSize: 19, letterSpacing: -0.4 }}
                  >
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Nights + guests steppers */}
          <View className="mt-3 gap-2">
            <Stepper
              label="Nights"
              value={nights}
              onDec={() => setNights((n) => Math.max(1, n - 1))}
              onInc={() => setNights((n) => Math.min(30, n + 1))}
            />
            <Stepper
              label="Guests"
              value={guests}
              onDec={() => setGuests((g) => Math.max(1, g - 1))}
              onInc={() => setGuests((g) => Math.min(10, g + 1))}
            />
          </View>

          {/* Trip summary */}
          <View className="mt-3 bg-cream-2 rounded-2xl px-4 py-3">
            <Text className="text-[12.5px] font-sans-bold text-ink">
              {fmtDate(checkIn)} → {fmtDate(checkOut)}
            </Text>
            <Text className="text-[11.5px] text-ink-3 mt-0.5">
              {nights} night{nights === 1 ? "" : "s"} · {guests} guest
              {guests === 1 ? "" : "s"}
            </Text>
          </View>

          {/* Price summary */}
          <SectionLabel className="mt-5">Price summary</SectionLabel>
          <View
            className="mt-2 bg-white rounded-2xl px-4 py-3.5 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <PriceLine label={`${naira(nightly)} × ${nights} nights`} value={naira(subtotal)} />
            <PriceLine label="Service fee" value={naira(serviceFee)} />
            <View className="my-2.5" style={{ height: 0.5, backgroundColor: "#e1dcd3" }} />
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[14px] font-sans-bold text-ink">Total · NGN</Text>
              <Text className="font-serif text-ink" style={{ fontSize: 22, letterSpacing: -0.4 }}>
                {naira(total)}
              </Text>
            </View>
          </View>

          {needsPhone && (
            <>
              <SectionLabel className="mt-5">Your phone number</SectionLabel>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+234 80 1234 5678"
                placeholderTextColor={INK_3}
                keyboardType="phone-pad"
                className="bg-white border border-line rounded-2xl px-3.5 py-3.5 text-ink text-[15px] mt-2"
              />
            </>
          )}

          <View className="mt-4 bg-primary-soft rounded-2xl px-3.5 py-3.5 flex-row gap-2.5">
            <Ionicons name="shield-checkmark" size={18} color={PRIMARY_INK} style={{ marginTop: 1 }} />
            <Text
              className="flex-1 text-[11.5px] leading-4"
              style={{ color: PRIMARY_INK, opacity: 0.8 }}
            >
              The host reviews and confirms within 24 hrs. Payment and arrival are
              arranged directly with them.
            </Text>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View
          className="absolute left-0 right-0 bottom-0 border-line"
          style={{
            backgroundColor: "rgba(245,240,235,0.96)",
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 30,
          }}
        >
          <Pressable
            disabled={submitting}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 17, opacity: submitting ? 0.6 : 1 }}
            onPress={submit}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {submitting ? "Sending…" : `Request to book · ${naira(total)}`}
            </Text>
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-1.5">
            You won&apos;t be charged — host confirms within 24 hrs
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View
      className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-3 border-line"
      style={{ borderWidth: 1 }}
    >
      <Text className="text-[13.5px] font-sans-bold text-ink">{label}</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onDec}
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
        >
          <Ionicons name="remove" size={14} color={INK_2} />
        </Pressable>
        <Text className="font-serif text-ink" style={{ fontSize: 17, minWidth: 20, textAlign: "center" }}>
          {value}
        </Text>
        <Pressable
          onPress={onInc}
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{ borderWidth: 1, borderColor: "#e1dcd3" }}
        >
          <Ionicons name="add" size={14} color={INK_2} />
        </Pressable>
      </View>
    </View>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Text
      className={`text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-1">
      <Text className="text-[13px] text-ink-2">{label}</Text>
      <Text className="text-[13px] font-sans-semibold text-ink">{value}</Text>
    </View>
  );
}
