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
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import vendorsService from "@/api/services/vendors";
import vendorJobsService from "@/api/services/vendorJobs";
import usersService from "@/api/services/users";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function buildDates(): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(10, 0, 0, 0);
  for (let i = 1; i <= 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

export default function BookServiceScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId?: string }>();
  const { user } = useAuth();
  const dates = useMemo(buildDates, []);

  const [vendor, setVendor] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [dateIdx, setDateIdx] = useState(0);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }
    let on = true;
    Promise.all([
      vendorsService.getPublic(vendorId),
      vendorsService.getPublicServices(vendorId),
      usersService.getProfile().catch(() => null),
    ])
      .then(([v, s, me]) => {
        if (!on) return;
        setVendor(v);
        setServices(s);
        setServiceId(s[0]?.id ?? null);
        if (me?.phone) setPhone(me.phone);
        if (me?.location && !address) setAddress(me.location);
      })
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const vendorFee = service?.priceNaira ?? 0;
  const total = Math.round(vendorFee * 1.1);
  const scheduledFor = dates[dateIdx];

  const book = async () => {
    if (!vendorId || !service) return;
    if (!address.trim()) { Alert.alert("Add an address", "Where should the vendor come?"); return; }
    if (!note.trim()) { Alert.alert("Add a note", "Tell the vendor what needs doing."); return; }
    const name = (user?.name ?? "").trim();
    const phoneToUse = phone.trim();
    if (!name) { Alert.alert("Missing name", "Update your profile name first."); return; }
    if (!phoneToUse) { Alert.alert("Add a phone number", "The vendor needs a number to reach you."); return; }

    setSubmitting(true);
    try {
      await vendorJobsService.createBooking({
        vendorId,
        title: service.name,
        description: note.trim(),
        address: address.trim(),
        category: vendor?.category ?? undefined,
        vendorFee,
        scheduledFor: scheduledFor.toISOString(),
        clientName: name,
        clientPhone: phoneToUse,
      });
      Alert.alert(
        "Request sent",
        `${vendor?.name ?? "The vendor"} will confirm your booking shortly.`,
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Couldn't book. Please try again.";
      Alert.alert("Booking failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <BouncyLoader color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {/* Top bar */}
        <View className="flex-row items-center gap-2.5 px-5 pt-1 pb-3">
          <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center">
            <Ionicons name="chevron-back" size={18} color={INK_2} />
          </Pressable>
          <Text className="flex-1 text-center text-[15px] font-sans-bold text-ink">Book a service</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Vendor pin */}
          <View className="flex-row gap-3 p-3 bg-white rounded-2xl items-center border-line" style={{ borderWidth: 0.5 }}>
            <PLAvatar initials={initialsOf(vendor?.name)} size={48} tone="primary" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[14px] font-sans-bold text-ink">{vendor?.name ?? "Vendor"}</Text>
                {vendor?.verified && <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />}
              </View>
              <Text className="text-xs text-ink-3">
                {[vendor?.category, vendor?.rating ? `⭐ ${vendor.rating}` : null, `${vendor?.jobsCount ?? 0} jobs`].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>

          {/* Service tier */}
          <Text className="font-serif text-ink mt-5" style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.5 }}>
            What needs <Text className="font-serif-italic">doing</Text>?
          </Text>
          {services.length === 0 ? (
            <Text className="text-[12.5px] text-ink-3 mt-3">This vendor hasn't listed any services yet.</Text>
          ) : (
            <View className="mt-2.5 gap-2">
              {services.map((t) => {
                const isOn = serviceId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setServiceId(t.id)}
                    className={`flex-row items-center gap-2.5 rounded-2xl px-3.5 py-3.5 ${isOn ? "bg-primary-soft" : "bg-white"}`}
                    style={{ borderWidth: isOn ? 1.5 : 1, borderColor: isOn ? PRIMARY : "#e1dcd3" }}
                  >
                    <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: isOn ? PRIMARY : "transparent", borderWidth: isOn ? 0 : 1.5, borderColor: "#e1dcd3" }}>
                      {isOn && <View style={{ width: 7, height: 7, borderRadius: 7, backgroundColor: "white" }} />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-sans-bold text-ink">{t.name}</Text>
                      {!!t.duration && <Text className="text-[11px] text-ink-3 mt-0.5">{t.duration}</Text>}
                    </View>
                    <Text className="font-serif text-ink" style={{ fontSize: 17, letterSpacing: -0.3 }}>{t.priceLabel}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Where */}
          <SectionLabel className="mt-5">Where</SectionLabel>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Flat / street / area"
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-3.5 py-3.5 text-ink text-[15px] mt-2"
          />

          {/* When */}
          <SectionLabel className="mt-5">When</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
            {dates.map((d, i) => {
              const isOn = dateIdx === i;
              return (
                <Pressable
                  key={d.toISOString()}
                  onPress={() => setDateIdx(i)}
                  className={`rounded-2xl items-center ${isOn ? "bg-ink" : "bg-white"}`}
                  style={{ width: 58, paddingVertical: 10, borderWidth: isOn ? 0 : 1, borderColor: "#e1dcd3" }}
                >
                  <Text className={`text-[10px] font-sans-bold tracking-wider uppercase ${isOn ? "text-white/70" : "text-ink/60"}`}>
                    {WEEKDAYS[d.getDay()]}
                  </Text>
                  <Text className={`font-serif ${isOn ? "text-white" : "text-ink"}`} style={{ fontSize: 18, letterSpacing: -0.4 }}>{d.getDate()}</Text>
                  <Text className={`text-[9px] font-sans-semibold ${isOn ? "text-white/60" : "text-ink-3"}`}>{MONTHS[d.getMonth()]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Note */}
          <SectionLabel className="mt-5">Notes for vendor</SectionLabel>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="What needs doing? Any access details?"
            placeholderTextColor={INK_3}
            className="bg-white border border-line rounded-2xl px-3.5 py-3 text-ink text-[14px] mt-2"
            style={{ minHeight: 70 }}
            textAlignVertical="top"
          />

          {/* Phone (if missing) */}
          {!(user?.phone ?? "").trim() && (
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

          {/* Escrow summary */}
          <View className="mt-4 bg-ink rounded-2xl px-3.5 py-3.5">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[11px] font-sans-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>You'll pay</Text>
              <Text className="font-serif text-white" style={{ fontSize: 24, letterSpacing: -0.5 }}>{naira(total)}</Text>
            </View>
            <Text className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {naira(vendorFee)} to the vendor + 10% platform fee
            </Text>
            <View className="flex-row gap-1.5 mt-2.5 items-start">
              <Ionicons name="shield-checkmark" size={13} color="#7ad296" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-[11.5px] leading-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                Held in escrow and released to the vendor after you confirm the job is done.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="absolute left-0 right-0 bottom-0 border-line" style={{ backgroundColor: "rgba(245,240,235,0.96)", borderTopWidth: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 10 }}>
          <Pressable
            disabled={submitting || !service}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 17, opacity: submitting || !service ? 0.6 : 1 }}
            onPress={book}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {submitting ? "Sending…" : service ? `Request booking · ${naira(total)}` : "Select a service"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-[13px] font-sans-bold text-ink-2 tracking-wider uppercase ${className ?? ""}`}>{children}</Text>
  );
}
