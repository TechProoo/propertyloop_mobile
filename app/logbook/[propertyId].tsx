import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Alert } from "@/lib/dialog";
import { Image } from "expo-image";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import listingsService, { type LogbookEntry } from "@/api/services/listings";
import type { Listing } from "@/api/types";
import { useAuth } from "@/context/auth";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

const TABS = ["All", "Verified", "Owner"] as const;
type TabId = (typeof TABS)[number];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function compactNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

export default function LogbookScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>("All");
  const [listing, setListing] = useState<Listing | null>(null);
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      setError(true);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    Promise.all([
      listingsService.getById(propertyId),
      listingsService.getLogbook(propertyId).catch(() => [] as LogbookEntry[]),
    ])
      .then(([l, es]) => {
        if (!active) return;
        setListing(l);
        setEntries(es);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [propertyId]);

  // Refetch just the entries after logging a new one.
  const reloadEntries = useCallback(async () => {
    if (!propertyId) return;
    const es = await listingsService.getLogbook(propertyId).catch(() => null);
    if (es) setEntries(es);
  }, [propertyId]);

  // Only the property's own agent can log maintenance (backend enforces this too).
  const isOwner =
    !!user?.id && user.role === "AGENT" && listing?.agent?.id === user.id;

  const summary = useMemo(() => {
    const verified = entries.filter((e) => e.verified).length;
    return {
      entries: entries.length,
      verified,
      selfReported: entries.length - verified,
      spend: compactNaira(entries.reduce((sum, e) => sum + (e.cost || 0), 0)),
    };
  }, [entries]);

  const visible =
    tab === "Verified"
      ? entries.filter((e) => e.verified)
      : tab === "Owner"
        ? entries.filter((e) => !e.verified)
        : entries;

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
        <Text className="text-[15px] font-sans-bold text-ink">Logbook</Text>
        <Pressable onPress={() => router.push("/logbook-info" as Href)} hitSlop={8}>
          <Ionicons name="information-circle-outline" size={20} color={INK_2} />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <BouncyLoader color={PRIMARY} />
        </View>
      ) : error || !listing ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="document-text-outline" size={36} color={INK_3} />
          <Text className="text-[16px] font-sans-bold text-ink mt-4 text-center">
            Logbook unavailable
          </Text>
          <Text className="text-[13px] text-ink-3 mt-1.5 text-center leading-5">
            This property may have been removed or is no longer active.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-5 px-5 py-2.5 rounded-full bg-ink active:opacity-80"
          >
            <Text className="text-white text-[13px] font-sans-bold">Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: isOwner ? 110 : 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Property hero */}
          <View className="px-5 pt-1">
            <View
              className="bg-white rounded-2xl overflow-hidden flex-row gap-3 p-3 border-line"
              style={{ borderWidth: 0.5 }}
            >
              <Image
                source={listing.coverImage}
                style={{ width: 64, height: 64, borderRadius: 12 }}
                contentFit="cover"
              />
              <View className="flex-1">
                <Text
                  className="text-[11px] font-sans-bold tracking-widest uppercase"
                  style={{ color: PRIMARY_INK }}
                >
                  Property Logbook
                </Text>
                <Text className="text-[14.5px] font-sans-bold text-ink mt-0.5" numberOfLines={1}>
                  {listing.title}
                </Text>
                <Text className="text-[11.5px] text-ink-3" numberOfLines={1}>
                  {listing.propertyType} · {listing.location}
                </Text>
              </View>
            </View>

            {/* Summary stat strip */}
            <View className="flex-row gap-2 mt-3">
              <Stat n={String(summary.entries)} l="Entries" />
              <Stat n={String(summary.verified)} l="Verified" tone="primary" />
              <Stat n={String(summary.selfReported)} l="Owner" />
              <Stat n={summary.spend} l="Spend" />
            </View>
          </View>

          {/* Tabs */}
          <View
            className="flex-row gap-5 px-5 mt-5 border-line"
            style={{ borderBottomWidth: 0.5 }}
          >
            {TABS.map((t) => {
              const on = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={{
                    paddingBottom: 12,
                    marginBottom: -1,
                    borderBottomWidth: on ? 2 : 0,
                    borderBottomColor: "#1a2120",
                  }}
                >
                  <Text
                    className={`text-[13px] ${
                      on ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"
                    }`}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Timeline */}
          <View className="px-5 pt-4">
            {visible.length === 0 ? (
              <View className="items-center py-12">
                <View className="w-14 h-14 rounded-full bg-cream-2 items-center justify-center">
                  <Ionicons name="construct-outline" size={24} color={INK_2} />
                </View>
                <Text className="text-[14px] font-sans-bold text-ink mt-3 text-center">
                  {entries.length === 0 ? "No entries yet" : "Nothing in this view"}
                </Text>
                <Text className="text-[12.5px] text-ink-3 mt-1 text-center leading-5">
                  {entries.length === 0
                    ? "Verified vendor jobs and owner-logged work will appear here."
                    : "Switch tabs to see other entries."}
                </Text>
              </View>
            ) : (
              visible.map((e, i) => (
                <EventRow key={e.id} event={e} last={i === visible.length - 1} />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Owner-only: log a piece of work manually. */}
      {!loading && !error && listing && isOwner && (
        <View
          className="absolute left-0 right-0 bottom-0 bg-cream border-line"
          style={{
            borderTopWidth: 0.5,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <Pressable
            onPress={() => setAdding(true)}
            className="bg-primary rounded-full items-center justify-center flex-row gap-2 active:opacity-80"
            style={{ paddingVertical: 15 }}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text className="text-white font-sans-bold text-[14px]">
              Log work on this property
            </Text>
          </Pressable>
        </View>
      )}

      <AddEntryModal
        visible={adding}
        onClose={() => setAdding(false)}
        onSubmit={async (payload) => {
          if (!propertyId) return;
          await listingsService.addLogbookEntry(propertyId, payload);
          await reloadEntries();
        }}
      />
    </SafeAreaView>
  );
}

type EntryPayload = {
  category: string;
  title: string;
  description?: string;
  vendorName: string;
  cost: number;
  completedAt?: string;
};

function AddEntryModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: EntryPayload) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCategory("");
    setTitle("");
    setDescription("");
    setVendorName("");
    setCost("");
  };

  const submit = async () => {
    if (saving) return;
    if (!category.trim() || !title.trim() || !vendorName.trim()) {
      Alert.alert("Missing details", "Category, title and who did the work are required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        category: category.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        vendorName: vendorName.trim(),
        cost: Math.max(0, Math.round(Number(cost.replace(/[^\d]/g, "")) || 0)),
        completedAt: new Date().toISOString(),
      });
      reset();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Please try again.";
      Alert.alert("Couldn't save entry", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(10,14,11,0.4)" }}>
        <View
          className="bg-cream rounded-t-3xl"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8, maxHeight: "90%" }}
        >
          {/* Handle + header */}
          <View className="items-center pt-2.5 pb-1">
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: "#d3cdc1" }} />
          </View>
          <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
            <Text className="text-[15px] font-sans-bold text-ink">Log work</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={INK_2} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field label="Category *">
              <Input value={category} onChangeText={setCategory} placeholder="e.g. Plumbing, Roofing" />
            </Field>
            <Field label="What was done *">
              <Input value={title} onChangeText={setTitle} placeholder="e.g. Replaced kitchen sink pipe" />
            </Field>
            <Field label="Details (optional)">
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Any notes about the work"
                multiline
              />
            </Field>
            <Field label="Who did the work *">
              <Input value={vendorName} onChangeText={setVendorName} placeholder="Vendor or handyman name" />
            </Field>
            <Field label="Cost (₦)">
              <Input value={cost} onChangeText={setCost} placeholder="0" keyboardType="number-pad" />
            </Field>
          </ScrollView>

          <View className="px-5 pt-1">
            <Pressable
              onPress={submit}
              disabled={saving}
              className="bg-primary rounded-full items-center active:opacity-80"
              style={{ paddingVertical: 15, opacity: saving ? 0.6 : 1 }}
            >
              <Text className="text-white font-sans-bold text-[15px]">
                {saving ? "Saving…" : "Add to logbook"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mt-3.5">
      <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mb-1.5">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={INK_3}
      className="bg-white border border-line rounded-2xl px-4 py-3 text-ink text-[14px]"
      style={props.multiline ? { minHeight: 70, textAlignVertical: "top" } : undefined}
      {...props}
    />
  );
}

function Stat({ n, l, tone }: { n: string; l: string; tone?: "primary" }) {
  return (
    <View
      className="flex-1 rounded-xl border-line px-2 py-2.5"
      style={{
        borderWidth: 0.5,
        backgroundColor: tone === "primary" ? "#e3efe7" : "#ffffff",
      }}
    >
      <Text
        className="font-serif"
        style={{
          fontSize: 18,
          letterSpacing: -0.3,
          color: tone === "primary" ? PRIMARY_INK : "#1a2120",
        }}
      >
        {n}
      </Text>
      <Text className="text-[10px] font-sans-bold text-ink-3 tracking-widest uppercase mt-0.5">
        {l}
      </Text>
    </View>
  );
}

function EventRow({ event, last }: { event: LogbookEntry; last: boolean }) {
  return (
    <View className="flex-row gap-3" style={{ alignItems: "stretch" }}>
      {/* Rail */}
      <View style={{ width: 32, alignItems: "center" }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: event.verified ? PRIMARY : "#f0f0f0",
            borderWidth: event.verified ? 0 : 1.5,
            borderColor: "#d3cdc1",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {event.verified && <Ionicons name="checkmark" size={12} color="#ffffff" />}
        </View>
        {!last && (
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor: "#e1dcd3",
              marginVertical: 4,
              minHeight: 16,
            }}
          />
        )}
      </View>

      {/* Card */}
      <View
        className="flex-1 bg-white rounded-2xl px-3.5 py-3 border-line"
        style={{ borderWidth: 0.5, marginBottom: last ? 0 : 12 }}
      >
        <View className="flex-row items-baseline justify-between gap-2">
          <Text
            className="text-[10.5px] font-sans-bold tracking-widest uppercase"
            style={{ color: event.verified ? PRIMARY_INK : ACCENT_INK }}
          >
            {event.category}
          </Text>
          <Text className="text-[11px] font-sans-semibold text-ink-3">
            {fmtDate(event.completedAt)}
          </Text>
        </View>
        <Text className="text-[14px] font-sans-bold text-ink mt-1">{event.title}</Text>
        {!!event.description && (
          <Text className="text-[12px] text-ink-3 mt-0.5 leading-5">
            {event.description}
          </Text>
        )}
        <View className="flex-row items-center gap-3 mt-2 flex-wrap">
          {!!event.vendorName && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="person-outline" size={12} color={INK_2} />
              <Text className="text-[11.5px] font-sans-semibold text-ink-2">
                {event.vendorName}
              </Text>
            </View>
          )}
          {event.cost > 0 && (
            <Text className="text-[11.5px] font-sans-bold text-ink">
              {naira(event.cost)}
            </Text>
          )}
          {event.verified && (
            <View className="flex-row items-center gap-1 ml-auto">
              <Ionicons name="shield-checkmark" size={12} color={ACCENT} />
              <Text className="text-[11px] font-sans-bold text-accent">Escrow-verified</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
