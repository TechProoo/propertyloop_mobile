import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import listingsService from "@/api/services/listings";
import rentalsService from "@/api/services/rentals";
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
const LEASE_OPTIONS = ["1 year", "2 years", "3 years"];

function buildDates(): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i * 7); // weekly options for move-in
    out.push(d);
  }
  return out.slice(0, 12);
}

function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

export default function RentalApplicationScreen() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const { user } = useAuth();
  const dates = useMemo(buildDates, []);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [lease, setLease] = useState("1 year");
  const [dateIdx, setDateIdx] = useState(0);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }
    let active = true;
    listingsService
      .getById(listingId)
      .then((l) => active && setListing(l))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [listingId]);

  const deposit = listing?.priceNaira ?? 0; // annual rent
  const agencyFee = Math.round(deposit * 0.1);
  const legalFee = Math.round(deposit * 0.1);
  const serviceFee = Math.round(deposit * 0.05);
  const total = deposit + agencyFee + legalFee + serviceFee;
  const startDate = dates[dateIdx];
  const needsPhone = !(user?.phone ?? "").trim();

  const submit = async () => {
    if (!listingId) return;
    const phoneToUse = (user?.phone ?? "").trim() || phone.trim();
    if (!phoneToUse) {
      Alert.alert("Add a phone number", "The landlord needs a number to reach you.");
      return;
    }
    setSubmitting(true);
    try {
      await rentalsService.create({
        listingId,
        deposit,
        agencyFee,
        legalFee,
        leaseDuration: lease,
        startDate: startDate.toISOString(),
        applicantPhone: phoneToUse,
      });
      Alert.alert(
        "Application submitted",
        "The landlord will review and contact you if approved.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? "Couldn't submit your application. Try again.";
      Alert.alert("Submission failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

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
            Apply to rent
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Property mini */}
          <View className="flex-row gap-3 p-2.5 bg-cream-2 rounded-2xl items-center">
            <Image
              source={listing?.coverImage}
              style={{ width: 50, height: 50, borderRadius: 10 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-[13.5px] font-sans-bold text-ink" numberOfLines={1}>
                {listing?.title ?? "Property"}
              </Text>
              <Text className="text-[11.5px] text-ink-3" numberOfLines={1}>
                {listing ? `${listing.priceLabel}${listing.period ?? "/yr"} · ${listing.location}` : ""}
              </Text>
            </View>
          </View>

          {/* Lease duration */}
          <SectionLabel className="mt-5">Lease duration</SectionLabel>
          <View className="flex-row gap-2 mt-2">
            {LEASE_OPTIONS.map((opt) => {
              const on = lease === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setLease(opt)}
                  className={`px-4 py-2.5 rounded-full ${on ? "bg-ink" : "bg-white"}`}
                  style={{ borderWidth: on ? 0 : 1, borderColor: "#e1dcd3" }}
                >
                  <Text
                    className="text-[13px] font-sans-bold"
                    style={{ color: on ? "#ffffff" : INK_2 }}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Move-in date */}
          <SectionLabel className="mt-5">Preferred move-in</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
          >
            {dates.map((d, i) => {
              const on = dateIdx === i;
              return (
                <Pressable
                  key={d.toISOString()}
                  onPress={() => setDateIdx(i)}
                  className={`rounded-2xl items-center border-line ${on ? "bg-ink" : "bg-white"}`}
                  style={{ width: 60, paddingVertical: 9, borderWidth: on ? 0 : 1 }}
                >
                  <Text
                    className={`text-[10px] font-sans-bold tracking-wider uppercase ${on ? "text-white/70" : "text-ink/60"}`}
                  >
                    {MONTHS[d.getMonth()]}
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

          {/* Cost breakdown */}
          <SectionLabel className="mt-5">Move-in costs</SectionLabel>
          <View
            className="mt-2 bg-white rounded-2xl px-4 py-3.5 border-line"
            style={{ borderWidth: 0.5 }}
          >
            <PriceLine label="Annual rent (deposit)" value={naira(deposit)} />
            <PriceLine label="Agency fee (10%)" value={naira(agencyFee)} />
            <PriceLine label="Legal fee (10%)" value={naira(legalFee)} />
            <PriceLine label="Service fee (5%)" value={naira(serviceFee)} />
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
              Funds are held in escrow until you confirm move-in. If approved, the
              landlord contacts you directly.
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
              {submitting ? "Submitting…" : "Submit application"}
            </Text>
          </Pressable>
          <Text className="text-center text-[11px] text-ink-3 mt-1.5">
            If approved · landlord contacts you directly
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
