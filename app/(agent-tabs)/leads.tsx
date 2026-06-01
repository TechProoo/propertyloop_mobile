import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { LEADS, type Lead, type LeadKind } from "@/mocks/agent";

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

const TONE_BG = { primary: "#e3efe7", accent: "#f5ead4", neutral: "#ece6df" };
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

export default function AgentLeadsScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: LEADS.length };
    (["inquiry", "viewing", "offer"] as LeadKind[]).forEach((k) => {
      c[k] = LEADS.filter((l) => l.kind === k).length;
    });
    return c;
  }, []);

  const filtered = tab === "all" ? LEADS : LEADS.filter((l) => l.kind === tab);

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
          {filtered.map((l) => (
            <LeadCard key={l.id} lead={l} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
        ) : lead.kind === "viewing" ? (
          <>
            <ActionBtn
              label="Reschedule"
              soft
              onPress={() =>
                router.push(
                  `/reschedule-viewing?leadId=${lead.id}&buyer=${encodeURIComponent(lead.buyer.name)}&listing=${encodeURIComponent(lead.listing.title)}` as Href,
                )
              }
            />
            <ActionBtn label="Decline" onPress={() => Alert.alert("Decline", "Decline this viewing?", [
              { text: "Cancel", style: "cancel" },
              { text: "Decline", style: "destructive" },
            ])} color="#b3261e" />
            <ActionBtn label="Message" filled onPress={openThread} />
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
