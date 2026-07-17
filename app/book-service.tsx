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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
  const [photos, setPhotos] = useState<{ uri: string; mimeType?: string }[]>([]);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const MAX_PHOTOS = 8;
  const pickPhotos = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Photo library", "Allow library access in Settings to add photos.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });
    if (!r.canceled) {
      setPhotos((p) =>
        [...p, ...r.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType }))].slice(
          0,
          MAX_PHOTOS,
        ),
      );
    }
  };
  const removePhoto = (i: number) =>
    setPhotos((p) => p.filter((_, idx) => idx !== i));

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
        if (me?.name) setName(me.name);
        if (me?.phone) setPhone(me.phone);
        if (me?.location && !address) setAddress(me.location);
      })
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  // The buyer pays the vendor's listed price with no markup — PropertyLoop's
  // commission is taken out of the vendor's cut, not added on top.
  const vendorFee = service?.priceNaira ?? 0;
  const total = vendorFee;
  const scheduledFor = dates[dateIdx];
  // A vendor can't book their own service (the backend rejects it too).
  const isOwn = !!user?.id && user.id === vendorId;

  const book = async () => {
    if (!vendorId || !service) return;
    if (isOwn) { Alert.alert("Not allowed", "You can't book your own service."); return; }
    if (!address.trim()) { Alert.alert("Add an address", "Where should the vendor come?"); return; }
    if (!note.trim()) { Alert.alert("Add a note", "Tell the vendor what needs doing."); return; }
    const nameToUse = name.trim();
    const phoneToUse = phone.trim();
    if (!nameToUse) { Alert.alert("Add your name", "The vendor needs a name for the booking."); return; }
    if (!phoneToUse) { Alert.alert("Add a phone number", "The vendor needs a number to reach you."); return; }

    setSubmitting(true);

    // Upload the "what needs fixing" photos best-effort, one at a time. A failed
    // photo upload must NOT sink the whole booking — we book with whatever
    // attached and tell the buyer if any couldn't. Capture the real reason so a
    // failure surfaces instead of hiding behind a generic message.
    const attachments: string[] = [];
    let photoError: string | null = null;
    for (const p of photos) {
      try {
        const { url } = await vendorJobsService.uploadAttachment(p.uri, {
          type: p.mimeType ?? "image/jpeg",
        });
        attachments.push(url);
      } catch (err: any) {
        photoError =
          err?.response?.data?.message ?? err?.message ?? "upload failed";
        console.warn("Job attachment upload failed:", photoError, err);
      }
    }

    try {
      await vendorJobsService.createBooking({
        vendorId,
        title: service.name,
        description: note.trim(),
        address: address.trim(),
        category: vendor?.category ?? undefined,
        vendorFee,
        scheduledFor: scheduledFor.toISOString(),
        clientName: nameToUse,
        clientPhone: phoneToUse,
        ...(attachments.length ? { attachments } : {}),
      });
      const someFailed = photos.length > 0 && attachments.length < photos.length;
      Alert.alert(
        "Request sent",
        someFailed
          ? `${vendor?.name ?? "The vendor"} will confirm your booking shortly.\n\nSome photos couldn't be attached (${photoError ?? "upload failed"}) — you can share them in chat.`
          : `${vendor?.name ?? "The vendor"} will confirm your booking shortly.`,
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e: any) {
      const raw = e?.response?.data?.message ?? e?.message ?? "Couldn't book. Please try again.";
      Alert.alert("Booking failed", Array.isArray(raw) ? raw.join(", ") : String(raw));
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
        <View className="flex-row items-center gap-2.5 px-5 pt-3 pb-3">
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
                {[vendor?.category, vendor?.rating ? `⭐ ${vendor.rating}` : null, (vendor?.jobsCount ?? 0) > 0 ? `${vendor.jobsCount} jobs` : null].filter(Boolean).join(" · ")}
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

          {/* Photos of what needs fixing */}
          <SectionLabel className="mt-5">Photos · optional</SectionLabel>
          <Text className="text-[11.5px] text-ink-3 mt-1">
            Show the vendor what needs fixing — up to {MAX_PHOTOS}.
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {photos.map((p, i) => (
              <View
                key={p.uri}
                className="rounded-xl overflow-hidden"
                style={{ width: 72, height: 72 }}
              >
                <Image
                  source={p.uri}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => removePhoto(i)}
                  hitSlop={6}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                >
                  <Ionicons name="close" size={12} color="#ffffff" />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable
                onPress={pickPhotos}
                className="rounded-xl items-center justify-center bg-white"
                style={{
                  width: 72,
                  height: 72,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: "#d3cdc1",
                }}
              >
                <Ionicons name="camera-outline" size={20} color={INK_2} />
                <Text className="text-[10px] font-sans-bold text-ink-3 mt-0.5">Add</Text>
              </Pressable>
            )}
          </View>

          {/* Name (if missing) */}
          {!(user?.name ?? "").trim() && (
            <>
              <SectionLabel className="mt-5">Your name</SectionLabel>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={INK_3}
                autoCapitalize="words"
                className="bg-white border border-line rounded-2xl px-3.5 py-3.5 text-ink text-[15px] mt-2"
              />
            </>
          )}

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
            disabled={submitting || !service || isOwn}
            className="bg-primary rounded-full items-center active:opacity-80"
            style={{ paddingVertical: 17, opacity: submitting || !service || isOwn ? 0.6 : 1 }}
            onPress={book}
          >
            <Text className="text-white font-sans-bold text-[15px]">
              {isOwn
                ? "This is your own service"
                : submitting
                  ? "Sending…"
                  : service
                    ? `Request booking · ${naira(total)}`
                    : "Select a service"}
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
