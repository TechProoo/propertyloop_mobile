import { useCallback, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  PressableScale,
  CountUp,
  Reveal,
  RevealScrollView,
  Appear,
  HeaderTransform,
  useHeaderTransform,
  stagger,
} from "@/components/anim";
import { useStaggeredEntrance } from "@/hooks/useStaggeredEntrance";
import { useAuth } from "@/context/auth";
import { NotificationBell } from "@/components/brand/NotificationBell";
import agentsService, {
  type AgentStats,
  type AgentSubscription,
} from "@/api/services/agents";
import listingsService from "@/api/services/listings";
import offersService from "@/api/services/offers";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";
import notificationsService from "@/api/services/notifications";
import type { Listing } from "@/api/types";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const ACCENT = "#b9842c";

function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const STATUS_UI: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: "Live", bg: "#e3efe7", fg: PRIMARY_INK },
  PENDING_REVIEW: { label: "In review", bg: "#f5ead4", fg: "#6b4a16" },
  PAUSED: { label: "Paused", bg: "#f0f0f0", fg: "#4d524f" },
  SOLD: { label: "Sold", bg: "#1a2120", fg: "#ffffff" },
  RENTED: { label: "Rented", bg: "#1a2120", fg: "#ffffff" },
  ARCHIVED: { label: "Archived", bg: "#f0f0f0", fg: "#7f857f" },
};

type UpNextTag = "Offers" | "Leads" | "Viewings" | "Listings" | "Vendors";
const UPNEXT_UI: Record<
  UpNextTag,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }
> = {
  Offers: { icon: "pricetag", bg: "#f5ead4", fg: "#6b4a16" },
  Leads: { icon: "people", bg: "#e3efe7", fg: PRIMARY_INK },
  Viewings: { icon: "calendar", bg: "#e3efe7", fg: PRIMARY_INK },
  Listings: { icon: "home", bg: "#f0f0f0", fg: INK_2 },
  Vendors: { icon: "construct", bg: "#f5ead4", fg: "#6b4a16" },
};

// Per-status presentation for hired-vendor jobs on the dashboard. `action`
// flags states that need the agent to do something (pay escrow / confirm).
const JOB_UI: Record<
  string,
  { label: string; bg: string; fg: string; action?: boolean }
> = {
  PENDING: { label: "Awaiting vendor", bg: "#f0f0f0", fg: INK_2 },
  ACCEPTED: { label: "Accepted", bg: "#e3efe7", fg: PRIMARY_INK },
  IN_PROGRESS: { label: "In progress", bg: "#e3efe7", fg: PRIMARY_INK },
  COMPLETED: { label: "Confirm & pay", bg: "#f5ead4", fg: "#6b4a16", action: true },
  DISPUTED: { label: "Disputed", bg: "#fdecea", fg: "#7a1d12", action: true },
};

// Jobs still in flight — the ones worth keeping on the dashboard. Confirmed,
// declined and cancelled jobs have run their course and drop off.
const LIVE_JOB_STATUSES = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "DISPUTED"];

function naira(n?: number) {
  return `₦${Math.round(n ?? 0).toLocaleString("en-NG")}`;
}

/**
 * The agent's operational dashboard — stats, "up next" nudges, hired vendors,
 * quick actions and their listings. Previously the Home tab; now lives behind
 * the Profile tab's "Profile" toggle, so it takes an `embedded` flag to drop
 * the status-bar top inset (the Profile tab header already owns that space).
 */
export default function AgentDashboard({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { scrollOffset, handleScroll } = useHeaderTransform();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [offersToReview, setOffersToReview] = useState(0);
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [unread, setUnread] = useState(0);
  const [sub, setSub] = useState<AgentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, l, offers, subscription, myJobs, notif] = await Promise.all([
        agentsService.getStats(),
        listingsService.listMine({ limit: 5 }),
        offersService.listReceived().catch(() => ({ items: [] as any[] })),
        agentsService.getSubscription().catch(() => null),
        vendorJobsService.listMine({ limit: 20 }).catch(() => ({ items: [] as VendorJob[] })),
        notificationsService.unreadCount().catch(() => ({ unread: 0 })),
      ]);
      setStats(s);
      setListings(l.items);
      setSub(subscription);
      setJobs(myJobs.items.filter((j) => LIVE_JOB_STATUSES.includes(j.status)));
      setUnread(notif.unread);
      setOffersToReview(
        offers.items.filter(
          (o: any) =>
            (o.status === "PENDING" || o.status === "COUNTERED") &&
            o.lastActor === "BUYER",
        ).length,
      );
    } catch {
      /* leave empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const dateLabel = now.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  // Action-needed jobs (confirm & pay / disputed) float to the top of the
  // hired-vendors list and drive the "Up next" nudge.
  const jobsNeedingAction = jobs.filter((j) => JOB_UI[j.status]?.action);
  const sortedJobs = [...jobs].sort(
    (a, b) =>
      (JOB_UI[b.status]?.action ? 1 : 0) - (JOB_UI[a.status]?.action ? 1 : 0),
  );

  const upNext: { tag: UpNextTag; title: string; href: Href }[] = [];
  if (jobsNeedingAction.length) {
    const n = jobsNeedingAction.length;
    upNext.push({
      tag: "Vendors",
      title: `${n} job${n === 1 ? "" : "s"} to confirm & pay`,
      href: `/service-job/${jobsNeedingAction[0].id}` as Href,
    });
  }
  if (offersToReview) {
    upNext.push({
      tag: "Offers",
      title: `${offersToReview} offer${offersToReview === 1 ? "" : "s"} to review`,
      href: "/agent-offers" as Href,
    });
  }
  if (stats?.leads.new) {
    upNext.push({
      tag: "Leads",
      title: `${stats.leads.new} new lead${stats.leads.new === 1 ? "" : "s"} to follow up`,
      href: "/(agent-tabs)/leads" as Href,
    });
  }
  if (stats?.viewings.upcoming) {
    upNext.push({
      tag: "Viewings",
      title: `${stats.viewings.upcoming} upcoming viewing${stats.viewings.upcoming === 1 ? "" : "s"}`,
      href: "/(agent-tabs)/listings" as Href,
    });
  }
  if (stats?.listings.pendingReview) {
    upNext.push({
      tag: "Listings",
      title: `${stats.listings.pendingReview} listing${stats.listings.pendingReview === 1 ? "" : "s"} in review`,
      href: "/(agent-tabs)/listings" as Href,
    });
  }

  const rating = stats?.profile.rating ?? 0;
  const conversion = stats
    ? Math.round(
        stats.leads.conversionRate > 1
          ? stats.leads.conversionRate
          : stats.leads.conversionRate * 100,
      )
    : 0;

  return (
    <View className="flex-1 bg-cream">
      <RevealScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      >
        {/* Hero — full-bleed emerald gradient */}
        <Appear from="fade" delay={0}>
          <LinearGradient
          colors={["#247a4b", PRIMARY, "#13502f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: embedded ? 14 : insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 46,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <View className="flex-row items-center gap-3.5">
            <View
              style={{
                borderRadius: 999,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.35)",
                padding: 2,
              }}
            >
              <PLAvatar
                initials={initialsOf(user?.name)}
                uri={user?.avatarUrl}
                size={52}
                tone="primary"
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[11px] font-sans-bold uppercase"
                style={{ color: "rgba(255,255,255,0.78)", letterSpacing: 1.2 }}
              >
                {greeting}
              </Text>
              <Text
                className="font-serif mt-0.5"
                style={{
                  fontSize: 26,
                  color: "#ffffff",
                  letterSpacing: -0.5,
                  lineHeight: 30,
                }}
              >
                <Text className="font-serif-italic">{firstName}</Text>
              </Text>
              <Text
                className="font-sans-medium mt-1"
                style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}
              >
                {dateLabel}
              </Text>
            </View>
            <NotificationBell
              count={unread}
              onPress={() => router.push("/notifications" as Href)}
              badgeBorderColor={PRIMARY}
            />
          </View>

          {/* Credential chips */}
          <View className="flex-row items-center gap-2 mt-4">
            <HeroChip icon="star" label={rating > 0 ? rating.toFixed(1) : "New"} />
            {stats?.profile.verified ? (
              <HeroChip icon="shield-checkmark" label="Verified" />
            ) : null}
            {stats && stats.leads.total > 0 ? (
              <HeroChip icon="trending-up" label={`${conversion}% converted`} />
            ) : null}
          </View>
          </LinearGradient>
        </Appear>

        {/* Overlapping stat card */}
        <Appear delay={stagger(0, 200)}>
        <View
          className="mx-4 bg-white rounded-3xl flex-row"
          style={{
            marginTop: -28,
            paddingVertical: 16,
            shadowColor: INK,
            shadowOpacity: 0.1,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 5,
          }}
        >
          <StatColumn
            icon="business"
            n={stats?.listings.active ?? 0}
            label="Live"
            onPress={() => router.push("/(agent-tabs)/listings" as Href)}
          />
          <Divider />
          <StatColumn
            icon="people"
            n={stats?.leads.total ?? 0}
            label="Leads"
            onPress={() => router.push("/(agent-tabs)/leads" as Href)}
          />
          <Divider />
          <StatColumn
            icon="eye"
            n={stats?.listings.totalViews ?? 0}
            label="Views"
            onPress={() => router.push("/(agent-tabs)/listings" as Href)}
          />
          </View>
        </Appear>

        {/* Subscription alert — surfaces a lapsed/cancelling plan up front */}
        <SubscriptionBanner sub={sub} />

        {loading ? (
          <View className="py-16 items-center">
            <BouncyLoader color={PRIMARY} />
          </View>
        ) : (
          <>
            {/* Up next */}
            {upNext.length > 0 && (
              <>
                <Appear delay={stagger(1, 200)}>
                  <SectionLabel className="px-5 pt-6">Up next</SectionLabel>
                </Appear>
                <View className="px-4 pt-2.5 gap-2.5">
                  {upNext.map((u, idx) => {
                    const ui = UPNEXT_UI[u.tag];
                    return (
                      <Appear key={u.tag} delay={stagger(idx + 2, 200)}>
                        <PressableScale
                          onPress={() => router.push(u.href)}
                          activeScale={0.98}
                          className="bg-white rounded-2xl px-3 py-3 flex-row items-center gap-3"
                          style={{
                            shadowColor: INK,
                            shadowOpacity: 0.05,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 1,
                          }}
                        >
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 14,
                              backgroundColor: ui.bg,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name={ui.icon} size={20} color={ui.fg} />
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-[10px] font-sans-bold uppercase"
                              style={{ color: ui.fg, letterSpacing: 1 }}
                            >
                              {u.tag}
                            </Text>
                            <Text className="text-[13.5px] font-sans-bold text-ink mt-0.5">
                              {u.title}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={INK_3}
                          />
                        </PressableScale>
                      </Appear>
                    );
                  })}
                </View>
              </>
            )}

            {/* Hired vendors — persistent home for service jobs the agent has
                booked, so they no longer vanish into notifications. */}
            {sortedJobs.length > 0 && (
              <>
                <View className="px-5 pt-6 flex-row items-baseline justify-between">
                  <SectionLabel>Hired vendors</SectionLabel>
                  <Pressable
                    onPress={() => router.push("/services" as Href)}
                    hitSlop={6}
                  >
                    <Text className="text-xs font-sans-bold text-primary">
                      Find vendors
                    </Text>
                  </Pressable>
                </View>
                <View className="px-4 pt-2.5 gap-2.5">
                  {sortedJobs.slice(0, 4).map((j, idx) => (
                    <Appear key={j.id} delay={stagger(idx, 120)}>
                      <JobRow job={j} />
                    </Appear>
                  ))}
                </View>
              </>
            )}

            {/* Quick actions */}
            <SectionLabel className="px-5 pt-6">Quick actions</SectionLabel>
            <View className="px-4 pt-2.5 flex-row gap-2.5">
              <QuickAction
                icon="add"
                label="New listing"
                tint={PRIMARY}
                bg="#e3efe7"
                onPress={() => router.push("/create-listing" as Href)}
              />
              <QuickAction
                icon="people-outline"
                label="Leads"
                tint={PRIMARY}
                bg="#e3efe7"
                onPress={() => router.push("/(agent-tabs)/leads" as Href)}
              />
              <QuickAction
                icon="pricetags-outline"
                label="Offers"
                tint={ACCENT}
                bg="#f5ead4"
                onPress={() => router.push("/agent-offers" as Href)}
              />
            </View>

            {/* Listings */}
            <View className="px-5 pt-6 flex-row items-baseline justify-between">
              <SectionLabel>Your listings</SectionLabel>
              <Pressable
                onPress={() => router.push("/(agent-tabs)/listings" as Href)}
                hitSlop={6}
              >
                <Text className="text-xs font-sans-bold text-primary">
                  See all
                </Text>
              </Pressable>
            </View>
            {listings.length === 0 ? (
              <View className="px-4 pt-2.5">
                <View
                  className="bg-white rounded-2xl px-4 py-8 items-center"
                  style={{
                    shadowColor: INK,
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 1,
                  }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: "#e3efe7" }}
                  >
                    <Ionicons name="home-outline" size={24} color={PRIMARY} />
                  </View>
                  <Text className="text-[14px] font-sans-bold text-ink">
                    No listings yet
                  </Text>
                  <Text className="text-[12px] text-ink-3 mt-1 text-center leading-5">
                    Create your first listing to start getting leads.
                  </Text>
                  <PressableScale
                    onPress={() => router.push("/create-listing" as Href)}
                    activeScale={0.95}
                    style={{
                      marginTop: 14,
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: PRIMARY,
                    }}
                  >
                    <Text className="text-white text-[12.5px] font-sans-bold">
                      New listing
                    </Text>
                  </PressableScale>
                </View>
              </View>
            ) : (
              <View className="px-4 pt-2.5 gap-2.5">
                {listings.slice(0, 3).map((l) => (
                  <Reveal key={l.id}>
                    <ListingRow listing={l} />
                  </Reveal>
                ))}
              </View>
            )}
          </>
        )}
      </RevealScrollView>
    </View>
  );
}

function SubscriptionBanner({ sub }: { sub: AgentSubscription | null }) {
  if (!sub || (sub.status !== "LAPSED" && sub.status !== "CANCELLED")) {
    return null;
  }
  const lapsed = sub.status === "LAPSED";
  const ends = sub.renewsAt
    ? new Date(sub.renewsAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
      })
    : null;

  // Lapsed = payment failed, listings already paused → urgent red.
  // Cancelled = plan winding down → warm amber heads-up.
  const ui = lapsed
    ? {
        bg: "#fdecea",
        border: "#f1b5ab",
        fg: "#7a1d12",
        icon: "alert-circle" as const,
        iconColor: "#b3261e",
        title: "Payment failed — your listings are paused",
        body: "Renew your plan to put your listings back live and start getting leads again.",
        cta: "Renew now",
      }
    : {
        bg: "#faf0dd",
        border: "#e7d2a6",
        fg: "#6b4a16",
        icon: "time-outline" as const,
        iconColor: "#b9842c",
        title: "Your plan is ending",
        body: ends
          ? `You've cancelled — your plan stays active until ${ends}, then your listings will be paused.`
          : "You've cancelled — your listings will be paused when the plan expires.",
        cta: "Reactivate plan",
      };

  return (
    <View className="px-4 pt-4">
      <Pressable
        onPress={() => router.push("/agent-plan" as Href)}
        className="rounded-2xl px-4 py-3.5 flex-row items-start gap-3 active:opacity-90"
        style={{ backgroundColor: ui.bg, borderWidth: 1, borderColor: ui.border }}
      >
        <Ionicons name={ui.icon} size={20} color={ui.iconColor} style={{ marginTop: 1 }} />
        <View className="flex-1">
          <Text className="text-[13px] font-sans-bold" style={{ color: ui.fg }}>
            {ui.title}
          </Text>
          <Text className="text-[11.5px] mt-0.5 leading-4" style={{ color: ui.fg, opacity: 0.85 }}>
            {ui.body}
          </Text>
          <View className="flex-row items-center gap-1 mt-2">
            <Text className="text-[12px] font-sans-bold" style={{ color: ui.fg }}>
              {ui.cta}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={ui.fg} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function HeroChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View
      className="flex-row items-center gap-1.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.16)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
      }}
    >
      <Ionicons name={icon} size={12} color="#ffe9b3" />
      <Text className="text-[11.5px] font-sans-bold text-white">{label}</Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        width: 1,
        marginVertical: 4,
        backgroundColor: "#ece6df",
      }}
    />
  );
}

function StatColumn({
  icon,
  n,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  n: number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.93}
      style={{ flex: 1, alignItems: "center" }}
    >
      <Ionicons name={icon} size={15} color={PRIMARY} />
      <CountUp
        value={n}
        className="font-serif text-ink mt-1"
        style={{ fontSize: 24, letterSpacing: -0.5 }}
      />
      <Text className="text-[10px] font-sans-bold text-ink-3 uppercase mt-0.5" style={{ letterSpacing: 0.8 }}>
        {label}
      </Text>
    </PressableScale>
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
      className={`text-[13px] font-sans-bold text-ink-2 uppercase ${className ?? ""}`}
      style={{ letterSpacing: 0.8 }}
    >
      {children}
    </Text>
  );
}

function QuickAction({
  icon,
  label,
  tint,
  bg,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.95}
      style={{
        flex: 1,
        shadowColor: INK,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
      className="bg-white rounded-2xl items-center justify-center gap-2 py-4"
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text className="text-[12px] font-sans-bold text-ink">{label}</Text>
    </PressableScale>
  );
}

function JobRow({ job }: { job: VendorJob }) {
  const meta = JOB_UI[job.status] ?? JOB_UI.PENDING;
  return (
    <PressableScale
      onPress={() => router.push(`/service-job/${job.id}` as Href)}
      activeScale={0.98}
      className="bg-white rounded-2xl p-2.5 flex-row items-center gap-3"
      style={{
        shadowColor: INK,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        borderWidth: meta.action ? 1 : 0,
        borderColor: meta.action ? "#e7d2a6" : "transparent",
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: "#e3efe7",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="construct" size={20} color={PRIMARY} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-sans-bold text-ink" numberOfLines={1}>
          {job.vendor?.name ?? job.title ?? "Vendor"}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5" numberOfLines={1}>
          {job.category ?? job.vendor?.category ?? job.title ?? "Service"}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: meta.bg }}
          >
            <Text
              className="text-[9.5px] font-sans-bold uppercase"
              style={{ color: meta.fg, letterSpacing: 0.6 }}
            >
              {meta.label}
            </Text>
          </View>
        </View>
      </View>
      <View className="items-end">
        <Text
          className="font-serif text-ink"
          style={{ fontSize: 15, letterSpacing: -0.3 }}
        >
          {naira(job.vendorFee)}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={INK_3} style={{ marginTop: 4 }} />
      </View>
    </PressableScale>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const meta = STATUS_UI[listing.status] ?? STATUS_UI.PAUSED;
  return (
    <PressableScale
      onPress={() => router.push(`/agent-listing/${listing.id}` as Href)}
      activeScale={0.98}
      className="bg-white rounded-2xl p-2.5 flex-row items-center gap-3"
      style={{
        shadowColor: INK,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <Image
        source={listing.coverImage}
        style={{ width: 64, height: 64, borderRadius: 14 }}
        contentFit="cover"
      />
      <View className="flex-1">
        <Text
          className="text-[14px] font-sans-bold text-ink"
          numberOfLines={1}
        >
          {listing.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5" numberOfLines={1}>
          {listing.location}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: meta.bg }}
          >
            <Text
              className="text-[9.5px] font-sans-bold uppercase"
              style={{ color: meta.fg, letterSpacing: 0.6 }}
            >
              {meta.label}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="eye-outline" size={12} color={INK_3} />
            <Text className="text-[11px] font-sans-semibold text-ink-3">
              {listing.viewsCount}
            </Text>
          </View>
        </View>
      </View>
      <Text
        className="font-serif text-ink"
        style={{ fontSize: 15, letterSpacing: -0.3 }}
      >
        {listing.priceLabel}
      </Text>
    </PressableScale>
  );
}
