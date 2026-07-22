import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BouncyLoader } from "@/components/brand/BouncyLoader";
import { PLAvatar } from "@/components/brand/PLAvatar";
import { useAuth } from "@/context/auth";
import bookmarksService from "@/api/services/bookmarks";
import viewingsService, { type Viewing } from "@/api/services/viewings";
import offersService, {
  type Offer,
  type PropertyPurchase,
} from "@/api/services/offers";
import vendorJobsService, { type VendorJob } from "@/api/services/vendorJobs";

type IonName = keyof typeof Ionicons.glyphMap;
type UpNextTone = "primary" | "accent" | "neutral";
type UpNextItem = {
  id: string;
  tone: UpNextTone;
  tag: string;
  title: string;
  detail: string;
  cta: string;
  icon: IonName;
  href: string;
};

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT_INK = "#6b4a16";
const INK_2 = "#4d524f";

const TONE_BG: Record<UpNextTone, string> = {
  primary: "#e3efe7",
  accent: "#f5ead4",
  neutral: "#f0f0f0",
};
const TONE_FG: Record<UpNextTone, string> = {
  primary: PRIMARY_INK,
  accent: ACCENT_INK,
  neutral: INK_2,
};

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "soon";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]} · ${hh}:${mm}`;
}
function initialsOf(name?: string | null) {
  if (!name) return "PL";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "PL"
  );
}

function displayName(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0] || "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function AccountScreen() {
  const { user, status } = useAuth();
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [purchases, setPurchases] = useState<PropertyPurchase[]>([]);
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [bm, vw, of, pu, jb] = await Promise.all([
        bookmarksService.listProperties().catch(() => []),
        viewingsService.listMine().catch(() => ({ items: [] as Viewing[] })),
        offersService.listMine().catch(() => ({ items: [] as Offer[] })),
        offersService.listPurchases().catch(() => [] as PropertyPurchase[]),
        vendorJobsService
          .listMine({ limit: 20 })
          .catch(() => ({ items: [] as VendorJob[] })),
      ]);
      setBookmarksCount(bm.length);
      setViewings(vw.items);
      setOffers(of.items);
      setPurchases(pu);
      setJobs(jb.items);
    } finally {
      setLoading(false);
    }
  }, []);

  // The account dashboard is entirely account-based (bookmarks, viewings,
  // offers, purchases, jobs) — a guest has none of it, so skip the fetch.
  useFocusEffect(
    useCallback(() => {
      if (status === "authed") load();
      else setLoading(false);
    }, [load, status]),
  );

  const firstName = displayName(user?.name);

  const upcomingViewings = useMemo(
    () =>
      viewings
        .filter(
          (v) =>
            (v.status === "PENDING" || v.status === "CONFIRMED") &&
            new Date(v.scheduledFor).getTime() > Date.now(),
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledFor).getTime() -
            new Date(b.scheduledFor).getTime(),
        ),
    [viewings],
  );
  const activeOffers = useMemo(
    () =>
      offers.filter((o) => o.status === "PENDING" || o.status === "COUNTERED"),
    [offers],
  );
  const activePurchases = useMemo(
    () => purchases.filter((p) => p.status === "IN_PROGRESS"),
    [purchases],
  );

  const stats: { n: string; l: string; href: string | null }[] = [
    { n: String(bookmarksCount), l: "Saved", href: "/(tabs)/saved" },
    {
      n: String(upcomingViewings.length),
      l: "Viewings",
      // No dedicated buyer viewings list — open the nearest viewing's property,
      // where it can be seen/managed. Dead (dimmed) when there are none.
      href: upcomingViewings[0]
        ? `/property/${upcomingViewings[0].listingId}`
        : null,
    },
    { n: String(activeOffers.length), l: "Offers", href: "/offers" },
    {
      n: String(activePurchases.length),
      l: "Log Book",
      href: "/purchase-progress",
    },
  ];

  const upNext = useMemo<UpNextItem[]>(() => {
    const items: UpNextItem[] = [];
    const nextV = upcomingViewings[0];
    if (nextV) {
      items.push({
        id: `v-${nextV.id}`,
        tone: "primary",
        tag: `Viewing · ${fmtWhen(nextV.scheduledFor)}`,
        title: nextV.listing?.title ?? "Property viewing",
        detail:
          nextV.status === "CONFIRMED"
            ? `Confirmed${nextV.agent?.name ? ` with ${nextV.agent.name}` : ""}`
            : "Awaiting the agent's confirmation",
        cta: "Open",
        icon: "calendar-outline",
        href: `/property/${nextV.listingId}`,
      });
    }
    offers
      .filter((o) => o.status === "COUNTERED" && o.lastActor === "AGENT")
      .slice(0, 2)
      .forEach((o) =>
        items.push({
          id: `o-${o.id}`,
          tone: "neutral",
          tag: "Counter offer",
          title: o.listing?.title ?? "Your offer",
          detail: `${o.currentAmountLabel} counter on your ${o.amountLabel}`,
          cta: "Review",
          icon: "swap-horizontal-outline",
          href: "/offers",
        }),
      );
    offers
      .filter((o) => o.status === "ACCEPTED")
      .slice(0, 1)
      .forEach((o) =>
        items.push({
          id: `oa-${o.id}`,
          tone: "primary",
          tag: "Offer accepted",
          title: o.listing?.title ?? "Your offer",
          detail: "The seller accepted — start the purchase",
          cta: "View",
          icon: "checkmark-circle-outline",
          href: "/offers",
        }),
      );
    const nextP = activePurchases[0];
    if (nextP) {
      items.push({
        id: `p-${nextP.id}`,
        tone: "accent",
        tag: "Purchase in progress",
        title: nextP.listing?.title ?? "Your purchase",
        detail: `${nextP.agreedAmountLabel} · under contract`,
        cta: "Track",
        icon: "document-text-outline",
        href: "/purchase-progress",
      });
    }
    return items.slice(0, 4);
  }, [upcomingViewings, offers, activePurchases]);

  const openJobs = jobs.filter(
    (j) =>
      j.status !== "CONFIRMED" &&
      j.status !== "CANCELLED" &&
      j.status !== "DECLINED",
  );

  // Browsing without an account has nowhere else to land on this tab — show
  // a sign-in prompt instead of a dashboard with nothing in it.
  if (status !== "authed") {
    return <GuestAccountView />;
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 104 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="bg-primary-soft px-5 pt-4 pb-5">
            <View className="flex-row items-center gap-3.5">
              <PLAvatar
                initials={initialsOf(user?.name)}
                uri={user?.avatarUrl}
                size={56}
                tone="primary"
              />
              <View className="flex-1">
                <Text
                  className="text-[11px] font-sans-bold tracking-widest uppercase"
                  style={{ color: PRIMARY_INK }}
                >
                  Hi, {firstName}
                </Text>
                <Text
                  className="font-serif mt-0.5"
                  style={{
                    fontSize: 24,
                    color: "#1a2120",
                    letterSpacing: -0.5,
                    lineHeight: 26,
                  }}
                >
                  Your{" "}
                  <Text className="font-serif-italic">search at a glance</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/settings" as Href)}
                className="flex-row items-center gap-1.5 rounded-full bg-white px-3 py-2"
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Open Settings"
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color={PRIMARY_INK}
                />
                <Text className="text-[11px] font-sans-bold" style={{ color: PRIMARY_INK }}>
                  Settings
                </Text>
              </Pressable>
            </View>

            {/* Stat strip */}
            <View className="mt-4 flex-row gap-2">
              {stats.map((s) => (
                <StatBox key={s.l} n={s.n} l={s.l} href={s.href} />
              ))}
            </View>
          </View>

          {/* Up next */}
          <SectionLabel className="px-5 pt-3.5">Up next</SectionLabel>
          {loading ? (
            <View className="py-8 items-center">
              <BouncyLoader color={PRIMARY} />
            </View>
          ) : upNext.length === 0 ? (
            <>
            <Text className="px-5 pt-2 text-[12.5px] text-ink-3 leading-5">
              Nothing needs your attention right now. Book a viewing or make an
              offer and it’ll show up here.
            </Text>
            <EmptyActionCard
              icon="compass-outline"
              title="Ready when you are"
              detail="Explore homes and your viewings or offers will appear here."
              action="Browse properties"
              onPress={() => router.push("/(tabs)/explore" as Href)}
            />
            </>
          ) : (
            <View className="px-4 pt-2.5 gap-2">
              {upNext.map((u) => (
                <UpNextRow key={u.id} item={u} />
              ))}
            </View>
          )}

          {/* Service Loop · open jobs */}
          <SectionLabel className="px-5 pt-4">
            Service Loop · open jobs
          </SectionLabel>
          {loading ? (
            <View className="py-8 items-center">
              <BouncyLoader color={PRIMARY} />
            </View>
          ) : openJobs.length === 0 ? (
            <>
            <Text className="px-5 pt-2 text-[12.5px] text-ink-3">
              No active service jobs. Hire a vendor from the Service Loop.
            </Text>
            <EmptyActionCard
              icon="construct-outline"
              title="Find help for your home"
              detail="Book a trusted professional for your next property task."
              action="Find a service provider"
              onPress={() => router.push("/services" as Href)}
              tone="accent"
            />
            </>
          ) : (
            <View className="px-4 pt-2.5 gap-2">
              {openJobs.map((j) => (
                <ServiceJobRow key={j.id} job={j} />
              ))}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Subcomponents ───────────────────────────────────────────

/**
 * What a guest sees on the Account tab instead of the personal dashboard —
 * everything here (bookmarks, viewings, offers, jobs) is account-based, so
 * there's nothing to show. Offers a way in, plus the handful of genuinely
 * non-account screens (Terms, Privacy, Help) that should stay reachable
 * without registering.
 */
function GuestAccountView() {
  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 104 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-primary-soft px-5 pt-6 pb-8 items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: "#ffffff" }}
            >
              <Ionicons name="person-outline" size={28} color={PRIMARY_INK} />
            </View>
            <Text className="text-[19px] font-sans-bold text-ink mt-3.5">
              You're browsing as a guest
            </Text>
            <Text className="text-[13px] text-ink-3 mt-1 text-center leading-5 max-w-[280px]">
              Create a free account to save homes, message agents and
              vendors, and track viewings and offers.
            </Text>
            <Pressable
              onPress={() => router.push("/intro" as Href)}
              className="mt-5 self-stretch rounded-full py-3.5 items-center"
              style={{ backgroundColor: PRIMARY }}
            >
              <Text className="text-white text-[14px] font-sans-bold">
                Create a free account
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/login" as Href)}
              className="mt-2.5 py-2"
            >
              <Text className="text-[13px] font-sans-bold" style={{ color: PRIMARY_INK }}>
                I already have an account
              </Text>
            </Pressable>
          </View>

          <SectionLabel className="px-5 pt-5 pb-2">Legal &amp; help</SectionLabel>
          <View className="mx-4 rounded-2xl bg-white border-line overflow-hidden" style={{ borderWidth: 0.5 }}>
            {[
              { label: "Terms of service", icon: "reader-outline" as const, href: "/terms" as Href },
              { label: "Privacy policy", icon: "shield-checkmark-outline" as const, href: "/privacy" as Href },
              { label: "Help & support", icon: "help-circle-outline" as const, href: "/help" as Href },
            ].map((row, i, arr) => (
              <Pressable
                key={row.label}
                onPress={() => router.push(row.href)}
                className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70"
                style={i < arr.length - 1 ? { borderBottomWidth: 0.5, borderColor: "#ece6df" } : undefined}
              >
                <Ionicons name={row.icon} size={18} color={INK_2} />
                <Text className="flex-1 text-[13.5px] font-sans-semibold text-ink">
                  {row.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={INK_2} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatBox({
  n,
  l,
  href,
}: {
  n: string;
  l: string;
  href: string | null;
}) {
  const body = (
    <View className="items-center justify-center">
      <Text
        className="font-serif text-ink"
        style={{ fontSize: 20, letterSpacing: -0.4 }}
      >
        {n}
      </Text>
      <Text
        className="font-sans-bold text-ink-3 uppercase mt-1 text-center"
        numberOfLines={2}
        style={{ fontSize: 8.5, lineHeight: 10.5, letterSpacing: 0.7, minHeight: 21 }}
      >
        {l}
      </Text>
    </View>
  );
  const boxClass = "flex-1 bg-white rounded-xl border-line";
  const boxStyle = {
    borderWidth: 0.5,
    paddingHorizontal: 4,
    paddingVertical: 10,
  } as const;

  // No destination (e.g. no upcoming viewings) → dimmed, non-interactive.
  if (!href) {
    return (
      <View className={boxClass} style={{ ...boxStyle, opacity: 0.55 }}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => router.push(href as Href)}
      className={`${boxClass} active:opacity-80`}
      style={boxStyle}
    >
      {body}
    </Pressable>
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

function EmptyActionCard({
  icon,
  title,
  detail,
  action,
  onPress,
  tone = "primary",
}: {
  icon: IonName;
  title: string;
  detail: string;
  action: string;
  onPress: () => void;
  tone?: "primary" | "accent";
}) {
  const accent = tone === "primary" ? PRIMARY : "#6b4a16";
  const tint = tone === "primary" ? "#e3efe7" : "#f5ead4";
  return (
    <View className="mx-4 mt-3 rounded-2xl bg-white p-4 border-line" style={{ borderWidth: 0.5 }}>
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: tint }}>
          <Ionicons name={icon} size={19} color={accent} />
        </View>
        <View className="flex-1">
          <Text className="text-[13.5px] font-sans-bold text-ink">{title}</Text>
          <Text className="text-[12px] text-ink-3 leading-4 mt-0.5">{detail}</Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        className="mt-3 self-start flex-row items-center gap-1.5 rounded-full px-3.5 py-2 active:opacity-85"
        style={{ backgroundColor: tint }}
      >
        <Text className="text-[12px] font-sans-bold" style={{ color: accent }}>{action}</Text>
        <Ionicons name="arrow-forward" size={13} color={accent} />
      </Pressable>
    </View>
  );
}

function UpNextRow({ item }: { item: UpNextItem }) {
  return (
    <Pressable
      onPress={() => router.push(item.href as Href)}
      className="bg-white rounded-2xl px-3.5 py-3 flex-row items-center gap-3 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <View
        className="w-[38px] h-[38px] rounded-[10px] items-center justify-center"
        style={{ backgroundColor: TONE_BG[item.tone] }}
      >
        <Ionicons name={item.icon} size={18} color={TONE_FG[item.tone]} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[10px] font-sans-bold tracking-widest uppercase"
          style={{ color: TONE_FG[item.tone] }}
        >
          {item.tag}
        </Text>
        <Text
          className="text-[13.5px] font-sans-bold text-ink mt-0.5"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5" numberOfLines={1}>
          {item.detail}
        </Text>
      </View>
      <Text className="text-[12.5px] font-sans-bold text-primary">
        {item.cta}
      </Text>
    </Pressable>
  );
}

const JOB_STATUS: Record<string, { label: string; dot: string }> = {
  PENDING: { label: "Requested", dot: "#b9842c" },
  ACCEPTED: { label: "Scheduled", dot: "#1f6f43" },
  IN_PROGRESS: { label: "In progress", dot: "#1f6f43" },
  COMPLETED: { label: "Confirm to release", dot: "#b9842c" },
  CONFIRMED: { label: "Paid", dot: "#7f857f" },
  DISPUTED: { label: "Disputed", dot: "#b3261e" },
};

function ServiceJobRow({ job }: { job: VendorJob }) {
  const meta = JOB_STATUS[job.status] ?? { label: job.status, dot: "#7f857f" };
  const initials = (job.vendor?.name ?? "Vendor")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Pressable
      onPress={() => router.push(`/service-job/${job.id}` as Href)}
      className="bg-white rounded-2xl px-3 py-3 flex-row items-center gap-3 border-line active:opacity-90"
      style={{ borderWidth: 0.5 }}
    >
      <PLAvatar initials={initials || "SV"} size={36} tone="primary" />
      <View className="flex-1">
        <Text
          className="text-[13.5px] font-sans-bold text-ink"
          numberOfLines={1}
        >
          {job.vendor?.name ?? "Vendor"}
        </Text>
        <Text className="text-[11.5px] text-ink-3" numberOfLines={1}>
          {job.title}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 6,
              backgroundColor: meta.dot,
            }}
          />
          <Text className="text-[10px] font-sans-bold text-ink-2 tracking-widest uppercase">
            {meta.label}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text
          className="font-serif text-ink"
          style={{ fontSize: 15, letterSpacing: -0.3 }}
        >
          ₦{Math.round(job.vendorFee).toLocaleString("en-NG")}
        </Text>
        {job.status === "COMPLETED" && (
          <View className="mt-1 bg-primary rounded-full px-2.5 py-1">
            <Text className="text-[10.5px] font-sans-bold text-white tracking-wider">
              Release
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
