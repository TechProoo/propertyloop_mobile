import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { LEADS, type Lead, type LeadKind } from "@/mocks/agent";
import viewingsService, { type Viewing } from "@/api/services/viewings";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS: { id: "all" | LeadKind; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "inquiry",  label: "Inquiries" },
  { id: "viewing",  label: "Viewings" },
  { id: "offer",    label: "Offers" },
];

const KIND_META: Record<LeadKind, { icon: keyof typeof Ionicons.glyphMap; tone: "primary" | "accent" | "neutral" }> = {
  inquiry: { icon: "chatbubble-outline",        tone: "neutral" },
  viewing: { icon: "calendar-outline",          tone: "primary" },
  offer:   { icon: "swap-horizontal-outline",   tone: "accent"  },
};

const TONE_BG = { primary: "#e3efe7", accent: "#f5ead4", neutral: "#f0f0f0" };
const TONE_FG = { primary: PRIMARY_INK, accent: ACCENT_INK, neutral: INK_2 };

const STATUS_LABEL: Record<Lead["status"], string> = {
  new:       "New",
  waiting:   "Awaiting reply",
  confirmed: "Confirmed",
  countered: "Countered",
  declined:  "Declined",
};

const STATUS_DOT: Record<Lead["status"], string> = {
  new:       "#1f6f43",
  waiting:   "#b9842c",
  confirmed: "#1f6f43",
  countered: "#c05a1f",
  declined:  "#7f857f",
};

// ─── Real viewings (GET /viewings) ────────────────────────────────────
const V_STATUS: Record<Viewing["status"], { label: string; dot: string }> = {
  PENDING:   { label: "Pending",   dot: "#b9842c" },
  CONFIRMED: { label: "Confirmed", dot: "#1f6f43" },
  COMPLETED: { label: "Completed", dot: "#7f857f" },
  CANCELLED: { label: "Cancelled", dot: "#b3261e" },
  NO_SHOW:   { label: "No-show",   dot: "#b3261e" },
};

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]} · ${hh}:${mm}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()) || "?";
}

export default function AgentLeadsScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [vLoading, setVLoading] = useState(true);
  const [vError, setVError] = useState(false);

  const loadViewings = useCallback(async () => {
    setVError(false);
    try {
      const res = await viewingsService.listForAgent();
      setViewings(res.items);
    } catch {
      setVError(true);
    } finally {
      setVLoading(false);
    }
  }, []);

  // Refetch on focus so confirmations/reschedules from the modal show up.
  useFocusEffect(
    useCallback(() => {
      loadViewings();
    }, [loadViewings]),
  );

  // Mock inquiries/offers only — real viewings replace the mocked ones.
  const otherLeads = useMemo(() => LEADS.filter((l) => l.kind !== "viewing"), []);

  const counts = useMemo(() => {
    const inquiry = otherLeads.filter((l) => l.kind === "inquiry").length;
    const offer = otherLeads.filter((l) => l.kind === "offer").length;
    const viewing = viewings.length;
    return { all: inquiry + offer + viewing, inquiry, offer, viewing };
  }, [otherLeads, viewings]);

  const patchViewing = (updated: Viewing) =>
    setViewings((arr) => arr.map((x) => (x.id === updated.id ? updated : x)));

  const confirmViewing = async (v: Viewing) => {
    try {
      patchViewing(await viewingsService.confirm(v.id));
    } catch {
      Alert.alert("Couldn’t confirm", "Please check your connection and try again.");
    }
  };

  const cancelViewing = (v: Viewing) => {
    Alert.alert("Decline viewing?", `${v.clientName} · ${v.listing?.title ?? "this listing"}`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            patchViewing(await viewingsService.cancel(v.id));
          } catch {
            Alert.alert("Couldn’t decline", "Please try again.");
          }
        },
      },
    ]);
  };

  const rescheduleViewing = (v: Viewing) =>
    router.push(
      `/reschedule-viewing?viewingId=${v.id}&buyer=${encodeURIComponent(
        v.clientName,
      )}&listing=${encodeURIComponent(v.listing?.title ?? "this listing")}` as Href,
    );

  const showInquiries = tab === "all" || tab === "inquiry";
  const showOffers = tab === "all" || tab === "offer";
  const showViewings = tab === "all" || tab === "viewing";
  const inquiryOfferLeads = otherLeads.filter(
    (l) => (showInquiries && l.kind === "inquiry") || (showOffers && l.kind === "offer"),
  );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header */}
        <View className="px-5 pt-1 pb-3 bg-cream">
          <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
            Inbound
          </Text>
          <Text
            className="font-serif text-ink mt-1"
            style={{ fontSize: 30, letterSpacing: -0.7, lineHeight: 32 }}
          >
            Your <Text className="font-serif-italic">leads</Text>
          </Text>
        </View>

        {/* Sticky tabs */}
        <View
          className="bg-cream"
          style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 18 }}
          >
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={{
                    paddingBottom: 12,
                    paddingTop: 4,
                    borderBottomWidth: on ? 2 : 0,
                    borderBottomColor: "#1a2120",
                  }}
                >
                  <Text
                    className={`text-[13px] ${
                      on
                        ? "font-sans-bold text-ink"
                        : "font-sans-semibold text-ink-3"
                    }`}
                  >
                    {t.label} · {counts[t.id] ?? 0}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-4 pt-3 gap-3">
          {/* Real viewings */}
          {showViewings && vLoading && (
            <View className="py-10 items-center">
              <ActivityIndicator color={PRIMARY} />
            </View>
          )}
          {showViewings && !vLoading && vError && (
            <Pressable
              onPress={() => {
                setVLoading(true);
                loadViewings();
              }}
              className="bg-white rounded-2xl p-4 items-center border-line active:opacity-90"
              style={{ borderWidth: 0.5 }}
            >
              <Ionicons name="cloud-offline-outline" size={22} color={INK_3} />
              <Text className="text-[13px] font-sans-bold text-ink mt-2">
                Couldn’t load viewings
              </Text>
              <Text className="text-[12px] text-ink-3 mt-0.5">Tap to retry</Text>
            </Pressable>
          )}
          {showViewings &&
            !vLoading &&
            !vError &&
            viewings.map((v) => (
              <ViewingCard
                key={v.id}
                viewing={v}
                onConfirm={() => confirmViewing(v)}
                onDecline={() => cancelViewing(v)}
                onReschedule={() => rescheduleViewing(v)}
              />
            ))}

          {/* Mock inquiries / offers */}
          {inquiryOfferLeads.map((l) => (
            <LeadCard key={l.id} lead={l} />
          ))}

          {/* Empty states */}
          {tab === "viewing" && !vLoading && !vError && viewings.length === 0 && (
            <EmptyHint
              icon="calendar-outline"
              text="No viewing requests yet. Buyers who book a viewing on your listings will show up here."
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Real viewing card ────────────────────────────────────────────────
function ViewingCard({
  viewing,
  onConfirm,
  onDecline,
  onReschedule,
}: {
  viewing: Viewing;
  onConfirm: () => void;
  onDecline: () => void;
  onReschedule: () => void;
}) {
  const meta = V_STATUS[viewing.status];
  const open = viewing.status === "PENDING" || viewing.status === "CONFIRMED";

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden border-line"
      style={{ borderWidth: 0.5 }}
    >
      {/* Status header */}
      <View
        className="flex-row items-center gap-2 px-3.5 py-2"
        style={{ backgroundColor: TONE_BG.primary }}
      >
        <Ionicons name="calendar-outline" size={13} color={TONE_FG.primary} />
        <Text
          className="text-[10.5px] font-sans-bold tracking-widest uppercase"
          style={{ color: TONE_FG.primary }}
          numberOfLines={1}
        >
          Viewing · {viewing.listing?.title ?? "Listing"}
        </Text>
        <View className="ml-auto flex-row items-center gap-1.5">
          <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: meta.dot }} />
          <Text
            className="text-[10px] font-sans-bold tracking-widest uppercase"
            style={{ color: TONE_FG.primary, opacity: 0.85 }}
          >
            {meta.label}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="flex-row gap-3 p-3">
        <PLAvatar initials={initialsOf(viewing.clientName)} size={44} tone="primary" />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
              {viewing.clientName}
            </Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3">
              {formatWhen(viewing.scheduledFor)}
            </Text>
          </View>
          {!!viewing.notes && (
            <Text className="text-[12.5px] text-ink-2 mt-1 leading-5" numberOfLines={2}>
              {viewing.notes}
            </Text>
          )}
          <Text className="text-[11.5px] font-sans-semibold text-ink-3 mt-1">
            {viewing.clientPhone}
          </Text>
        </View>
      </View>

      {/* Action row — only while the viewing is still live */}
      {open && (
        <View
          className="flex-row"
          style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}
        >
          <ActionBtn label="Reschedule" soft onPress={onReschedule} />
          <ActionBtn label="Decline" onPress={onDecline} color="#b3261e" />
          {viewing.status === "PENDING" ? (
            <ActionBtn label="Confirm" filled onPress={onConfirm} />
          ) : null}
        </View>
      )}
    </View>
  );
}

function EmptyHint({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View className="items-center px-6 py-12">
      <View className="w-14 h-14 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={24} color={INK_2} />
      </View>
      <Text className="text-[13px] text-ink-3 mt-3 text-center leading-5">{text}</Text>
    </View>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const meta = KIND_META[lead.kind];

  const openThread = () =>
    lead.threadId
      ? router.push(`/conversation/${lead.threadId}` as Href)
      : Alert.alert("Message", "No thread for this lead yet.");

  const reviewOffer = () => router.push("/offer-action" as Href);

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden border-line"
      style={{ borderWidth: 0.5 }}
    >
      {/* Status header */}
      <View
        className="flex-row items-center gap-2 px-3.5 py-2"
        style={{ backgroundColor: TONE_BG[meta.tone] }}
      >
        <Ionicons name={meta.icon} size={13} color={TONE_FG[meta.tone]} />
        <Text
          className="text-[10.5px] font-sans-bold tracking-widest uppercase"
          style={{ color: TONE_FG[meta.tone] }}
        >
          {lead.kind === "offer" ? "Offer" : lead.kind === "viewing" ? "Viewing" : "Inquiry"} · {lead.listing.title}
        </Text>
        <View className="ml-auto flex-row items-center gap-1.5">
          <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: STATUS_DOT[lead.status] }} />
          <Text
            className="text-[10px] font-sans-bold tracking-widest uppercase"
            style={{ color: TONE_FG[meta.tone], opacity: 0.85 }}
          >
            {STATUS_LABEL[lead.status]}
          </Text>
        </View>
      </View>

      {/* Body */}
      <Pressable onPress={openThread} className="flex-row gap-3 p-3 active:opacity-90">
        <PLAvatar initials={lead.buyer.initials} size={44} tone={lead.buyer.tone} />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
              {lead.buyer.name}
            </Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3">
              {lead.when}
            </Text>
          </View>
          <Text className="text-[12.5px] text-ink-2 mt-1 leading-5" numberOfLines={2}>
            {lead.detail}
          </Text>
          {lead.amount && (
            <Text
              className="font-serif mt-1"
              style={{ fontSize: 16, color: ACCENT_INK, letterSpacing: -0.3 }}
            >
              {lead.amount}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Action row */}
      <View
        className="flex-row"
        style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}
      >
        {lead.kind === "offer" ? (
          <>
            <ActionBtn label="Decline" soft onPress={() => Alert.alert("Decline", `Decline ${lead.amount}?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Decline", style: "destructive" },
            ])} />
            <ActionBtn label="Counter" onPress={reviewOffer} color={PRIMARY} />
            <ActionBtn label="Accept" filled onPress={() => Alert.alert("Accept", `Accept ${lead.amount}? Kicks off the purchase process.`, [
              { text: "Cancel", style: "cancel" },
              { text: "Accept" },
            ])} />
          </>
        ) : (
          <>
            <ActionBtn label="Mark seen" soft onPress={() => Alert.alert("Marked", "Lead marked as seen.")} />
            <ActionBtn label="Reply" filled onPress={openThread} />
          </>
        )}
      </View>
    </View>
  );
}

function ActionBtn({
  label, soft, filled, color, onPress,
}: {
  label: string;
  soft?: boolean;
  filled?: boolean;
  color?: string;
  onPress: () => void;
}) {
  const bg = filled ? PRIMARY : "transparent";
  const fg = filled ? "#ffffff" : soft ? INK_3 : color ?? "#1a2120";
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center active:opacity-80"
      style={{
        backgroundColor: bg,
        paddingVertical: 13,
        borderRightWidth: filled ? 0 : 0.5,
        borderRightColor: "#ece6df",
      }}
    >
      <Text className="text-[13px] font-sans-bold" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}
