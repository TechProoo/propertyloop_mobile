import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import viewingsService, { type Viewing } from "@/api/services/viewings";
import leadsService, { type Lead, type LeadStatus } from "@/api/services/leads";
import offersService, { type Offer } from "@/api/services/offers";
import messagesService, { type ConversationRole } from "@/api/services/messages";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const LINE = "#e1dcd3";

const TABS = [
  { id: "all", label: "All" },
  { id: "inquiry", label: "Inquiries" },
  { id: "viewing", label: "Viewings" },
  { id: "offer", label: "Offers" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const TONE_BG = { primary: "#e3efe7", accent: "#f5ead4", neutral: "#f0f0f0" };
const TONE_FG = { primary: PRIMARY_INK, accent: ACCENT_INK, neutral: INK_2 };

const LEAD_STATUS: Record<LeadStatus, { label: string; dot: string }> = {
  NEW: { label: "New", dot: "#1f6f43" },
  CONTACTED: { label: "Contacted", dot: "#b9842c" },
  VIEWING_SCHEDULED: { label: "Viewing set", dot: "#1f6f43" },
  NEGOTIATING: { label: "Negotiating", dot: "#c05a1f" },
  CONVERTED: { label: "Converted", dot: "#1f6f43" },
  LOST: { label: "Lost", dot: "#7f857f" },
};

const V_STATUS: Record<Viewing["status"], { label: string; dot: string }> = {
  PENDING: { label: "Pending", dot: "#b9842c" },
  CONFIRMED: { label: "Confirmed", dot: "#1f6f43" },
  COMPLETED: { label: "Completed", dot: "#7f857f" },
  CANCELLED: { label: "Cancelled", dot: "#b3261e" },
  NO_SHOW: { label: "No-show", dot: "#b3261e" },
};

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatWhen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]} · ${hh}:${mm}`;
}
function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/);
  return (((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()) || "?";
}

export default function AgentLeadsScreen() {
  const [tab, setTab] = useState<TabId>("all");
  const { user } = useAuth();

  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [v, l, o] = await Promise.all([
        viewingsService.listForAgent().catch(() => ({ items: [] as Viewing[] })),
        leadsService.list({ limit: 50 }).catch(() => ({ items: [] as Lead[] })),
        offersService.listReceived().catch(() => ({ items: [] as Offer[] })),
      ]);
      setViewings(v.items);
      setLeads(l.items);
      setOffers(o.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(
    () => ({
      all: leads.length + viewings.length + offers.length,
      inquiry: leads.length,
      viewing: viewings.length,
      offer: offers.length,
    }),
    [leads, viewings, offers],
  );

  // ─── Viewing actions ────────────────────────────────────────────────────
  const patchViewing = (u: Viewing) => setViewings((arr) => arr.map((x) => (x.id === u.id ? u : x)));
  const confirmViewing = async (v: Viewing) => {
    try { patchViewing(await viewingsService.confirm(v.id)); }
    catch { Alert.alert("Couldn’t confirm", "Please try again."); }
  };
  const cancelViewing = (v: Viewing) =>
    Alert.alert("Decline viewing?", `${v.clientName} · ${v.listing?.title ?? "this listing"}`, [
      { text: "Keep", style: "cancel" },
      { text: "Decline", style: "destructive", onPress: async () => {
        try { patchViewing(await viewingsService.cancel(v.id)); }
        catch { Alert.alert("Couldn’t decline", "Please try again."); }
      } },
    ]);
  const rescheduleViewing = (v: Viewing) =>
    router.push(`/reschedule-viewing?viewingId=${v.id}&buyer=${encodeURIComponent(v.clientName)}&listing=${encodeURIComponent(v.listing?.title ?? "this listing")}` as Href);

  const showInquiries = tab === "all" || tab === "inquiry";
  const showViewings = tab === "all" || tab === "viewing";
  const showOffers = tab === "all" || tab === "offer";

  const empty =
    !loading &&
    ((tab === "inquiry" && leads.length === 0) ||
      (tab === "viewing" && viewings.length === 0) ||
      (tab === "offer" && offers.length === 0) ||
      (tab === "all" && counts.all === 0));

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Header */}
        <View className="px-5 pt-1 pb-3 bg-cream">
          <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">Inbound</Text>
          <Text className="font-serif text-ink mt-1" style={{ fontSize: 30, letterSpacing: -0.7, lineHeight: 32 }}>
            Your <Text className="font-serif-italic">leads</Text>
          </Text>
        </View>

        {/* Sticky tabs */}
        <View className="bg-cream" style={{ borderBottomWidth: 0.5, borderBottomColor: LINE }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 18 }}>
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ paddingBottom: 12, paddingTop: 4, borderBottomWidth: on ? 2 : 0, borderBottomColor: "#1a2120" }}>
                  <Text className={`text-[13px] ${on ? "font-sans-bold text-ink" : "font-sans-semibold text-ink-3"}`}>
                    {t.label} · {counts[t.id]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View className="py-16 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <View className="px-4 pt-3 gap-3">
            {showViewings && viewings.map((v) => (
              <ViewingCard key={v.id} viewing={v} onConfirm={() => confirmViewing(v)} onDecline={() => cancelViewing(v)} onReschedule={() => rescheduleViewing(v)} />
            ))}
            {showInquiries && leads.map((l) => (
              <LeadCard key={l.id} lead={l} viewerRole={user?.role as ConversationRole} onChanged={load} />
            ))}
            {showOffers && offers.map((o) => (
              <OfferCard key={o.id} offer={o} onChanged={load} />
            ))}
            {empty && (
              <EmptyHint icon="file-tray-outline" text="Nothing here yet. Inquiries, viewings, and offers on your listings will show up here." />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Real inquiry (lead) card ─────────────────────────────────────────────
function LeadCard({ lead, viewerRole, onChanged }: { lead: Lead; viewerRole?: ConversationRole; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const meta = LEAD_STATUS[lead.status];

  const markContacted = async () => {
    setBusy(true);
    try { await leadsService.update(lead.id, { status: "CONTACTED" }); onChanged(); }
    catch (e: any) { Alert.alert("Failed", e?.response?.data?.message ?? "Please try again."); }
    finally { setBusy(false); }
  };

  const reach = async () => {
    if (lead.buyerUserId && viewerRole) {
      try {
        const conv = await messagesService.createOrFind({
          recipientId: lead.buyerUserId,
          recipientRole: "BUYER",
          senderRole: viewerRole,
          listingId: lead.listingId,
        });
        router.push(`/conversation/${conv.conversationId}` as Href);
        return;
      } catch { /* fall through to call */ }
    }
    if (lead.phone) Linking.openURL(`tel:${lead.phone}`);
  };

  return (
    <View className="bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
      <View className="flex-row items-center gap-2 px-3.5 py-2" style={{ backgroundColor: TONE_BG.neutral }}>
        <Ionicons name="chatbubble-outline" size={13} color={TONE_FG.neutral} />
        <Text className="text-[10.5px] font-sans-bold tracking-widest uppercase" style={{ color: TONE_FG.neutral }} numberOfLines={1}>
          Inquiry · {lead.listing?.title ?? "Listing"}
        </Text>
        <View className="ml-auto flex-row items-center gap-1.5">
          <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: meta.dot }} />
          <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: TONE_FG.neutral, opacity: 0.85 }}>{meta.label}</Text>
        </View>
      </View>

      <View className="flex-row gap-3 p-3">
        <PLAvatar initials={initialsOf(lead.name)} size={44} tone="primary" />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>{lead.name}</Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3">{formatWhen(lead.createdAt)}</Text>
          </View>
          {!!lead.message && <Text className="text-[12.5px] text-ink-2 mt-1 leading-5" numberOfLines={3}>{lead.message}</Text>}
          <Text className="text-[11.5px] font-sans-semibold text-ink-3 mt-1">{lead.phone}</Text>
        </View>
      </View>

      {busy ? (
        <View className="py-2.5 items-center" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}><BouncyLoader color={PRIMARY} /></View>
      ) : (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          {lead.status === "NEW" && <ActionBtn label="Mark contacted" soft onPress={markContacted} />}
          <ActionBtn label={lead.buyerUserId ? "Message" : "Call"} filled onPress={reach} />
        </View>
      )}
    </View>
  );
}

// ─── Real offer card ──────────────────────────────────────────────────────
function OfferCard({ offer, onChanged }: { offer: Offer; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const myTurn = (offer.status === "PENDING" || offer.status === "COUNTERED") && offer.lastActor === "BUYER";

  const act = (fn: () => Promise<unknown>, label: string) =>
    Alert.alert(`${label}?`, `${label} the ${offer.currentAmountLabel} offer on ${offer.listing?.title ?? "this listing"}?`, [
      { text: "Cancel", style: "cancel" },
      { text: label, onPress: async () => {
        setBusy(true);
        try { await fn(); onChanged(); }
        catch (e: any) { Alert.alert("Failed", e?.response?.data?.message ?? "Please try again."); setBusy(false); }
      } },
    ]);

  return (
    <View className="bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
      <View className="flex-row items-center gap-2 px-3.5 py-2" style={{ backgroundColor: TONE_BG.accent }}>
        <Ionicons name="swap-horizontal-outline" size={13} color={TONE_FG.accent} />
        <Text className="text-[10.5px] font-sans-bold tracking-widest uppercase" style={{ color: TONE_FG.accent }} numberOfLines={1}>
          Offer · {offer.listing?.title ?? "Listing"}
        </Text>
      </View>

      <Pressable onPress={() => router.push(`/property/${offer.listingId}` as Href)} className="flex-row gap-3 p-3 active:opacity-90">
        <PLAvatar initials={initialsOf(offer.buyer?.name)} size={44} tone="primary" />
        <View className="flex-1">
          <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>{offer.buyer?.name ?? "Buyer"}</Text>
          <Text className="text-[12px] text-ink-3 mt-0.5">Asking {offer.listing?.priceLabel ?? "—"}</Text>
          <Text className="font-serif mt-1" style={{ fontSize: 16, color: ACCENT_INK, letterSpacing: -0.3 }}>{offer.currentAmountLabel}</Text>
        </View>
      </Pressable>

      {busy ? (
        <View className="py-2.5 items-center" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}><BouncyLoader color={PRIMARY} /></View>
      ) : myTurn ? (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn label="Decline" soft onPress={() => act(() => offersService.decline(offer.id), "Decline")} />
          <ActionBtn label="Counter" color={PRIMARY} onPress={() => router.push(`/offer-action?offerId=${offer.id}` as Href)} />
          <ActionBtn label="Accept" filled onPress={() => act(() => offersService.accept(offer.id), "Accept")} />
        </View>
      ) : null}
    </View>
  );
}

// ─── Real viewing card (unchanged behaviour) ──────────────────────────────
function ViewingCard({ viewing, onConfirm, onDecline, onReschedule }: { viewing: Viewing; onConfirm: () => void; onDecline: () => void; onReschedule: () => void }) {
  const meta = V_STATUS[viewing.status];
  const open = viewing.status === "PENDING" || viewing.status === "CONFIRMED";

  return (
    <View className="bg-white rounded-2xl overflow-hidden border-line" style={{ borderWidth: 0.5 }}>
      <View className="flex-row items-center gap-2 px-3.5 py-2" style={{ backgroundColor: TONE_BG.primary }}>
        <Ionicons name="calendar-outline" size={13} color={TONE_FG.primary} />
        <Text className="text-[10.5px] font-sans-bold tracking-widest uppercase" style={{ color: TONE_FG.primary }} numberOfLines={1}>
          Viewing · {viewing.listing?.title ?? "Listing"}
        </Text>
        <View className="ml-auto flex-row items-center gap-1.5">
          <View style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: meta.dot }} />
          <Text className="text-[10px] font-sans-bold tracking-widest uppercase" style={{ color: TONE_FG.primary, opacity: 0.85 }}>{meta.label}</Text>
        </View>
      </View>

      <View className="flex-row gap-3 p-3">
        <PLAvatar initials={initialsOf(viewing.clientName)} size={44} tone="primary" />
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>{viewing.clientName}</Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3">{formatWhen(viewing.scheduledFor)}</Text>
          </View>
          {!!viewing.notes && <Text className="text-[12.5px] text-ink-2 mt-1 leading-5" numberOfLines={2}>{viewing.notes}</Text>}
          <Text className="text-[11.5px] font-sans-semibold text-ink-3 mt-1">{viewing.clientPhone}</Text>
        </View>
      </View>

      {open && (
        <View className="flex-row" style={{ borderTopWidth: 0.5, borderTopColor: "#ece6df" }}>
          <ActionBtn label="Reschedule" soft onPress={onReschedule} />
          <ActionBtn label="Decline" onPress={onDecline} color="#b3261e" />
          {viewing.status === "PENDING" ? <ActionBtn label="Confirm" filled onPress={onConfirm} /> : null}
        </View>
      )}
    </View>
  );
}

function EmptyHint({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="items-center px-6 py-12">
      <View className="w-14 h-14 rounded-full bg-cream-2 items-center justify-center">
        <Ionicons name={icon} size={24} color={INK_2} />
      </View>
      <Text className="text-[13px] text-ink-3 mt-3 text-center leading-5">{text}</Text>
    </View>
  );
}

function ActionBtn({ label, soft, filled, color, onPress }: { label: string; soft?: boolean; filled?: boolean; color?: string; onPress: () => void }) {
  const bg = filled ? PRIMARY : "transparent";
  const fg = filled ? "#ffffff" : soft ? INK_3 : color ?? "#1a2120";
  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center active:opacity-80" style={{ backgroundColor: bg, paddingVertical: 13, borderRightWidth: filled ? 0 : 0.5, borderRightColor: "#ece6df" }}>
      <Text className="text-[13px] font-sans-bold" style={{ color: fg }}>{label}</Text>
    </Pressable>
  );
}
