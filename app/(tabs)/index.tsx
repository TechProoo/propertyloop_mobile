import { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";
import {
  AGENTS,
  CONTACT,
  FEATURED_ALL,
  FEATURED_LEKKI,
  FEATURED_VENDOR,
  LOCATIONS,
  LOGBOOK_PREVIEW,
  MODES,
  NEARBY_ALL,
  NEARBY_LEKKI,
  RECENT_ITEMS,
  SERVICE_CATEGORIES,
  SHORTLETS,
  type Mode,
} from "@/mocks/home";

const PRIMARY = "#1f6f43";
const PRIMARY_INK = "#134a2d";
const ACCENT = "#b9842c";
const INK = "#1a2120";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";
const SURFACE_2 = "#ece6df";

function picsum(seed: string, w = 600, h = 400) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

// ─────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>("Rent");
  const [location, setLocation] = useState("Lekki");
  const isAll = location === "All";

  const featured = isAll ? FEATURED_ALL : FEATURED_LEKKI;
  const nearby = isAll ? NEARBY_ALL : NEARBY_LEKKI;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <SearchBar />
        <ModeSwitcher selected={mode} onSelect={setMode} />
        <LocationChips selected={location} onSelect={setLocation} />

        <SectionHeader
          title={isAll ? "Featured across Lagos" : `Featured in ${location}`}
          action={isAll ? "See all 412" : "See all"}
        />
        <FeaturedCarousel items={featured} />

        <MarketPulse location={isAll ? "Lagos market" : `${location} Phase 1`} all={isAll} />

        <SectionHeader title="Pick up where you left off" action="Clear" />
        <RecentlyViewed />

        <ServiceLoopSection />

        <SectionHeader
          title={isAll ? "Newest on the market" : "Near your search"}
          action="Map view"
        />
        <NearbyList items={nearby} />

        <ShortletsSection />

        <AgentsSection />

        <LogbookTeaser />

        <ContactCard />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sections — each kept inline; promote to its own file if reused.
// ─────────────────────────────────────────────────────────────────

function Header() {
  return (
    <View className="px-5 pt-1 flex-row items-center justify-between">
      <View>
        <Text className="text-ink-3 text-[13px] font-sans-semibold">
          Good morning,
        </Text>
        <Text className="text-ink text-[22px] font-sans-bold mt-0.5 tracking-tight">
          Adebayo 👋
        </Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable className="w-10 h-10 rounded-full bg-cream-2 items-center justify-center">
          <Ionicons name="notifications-outline" size={18} color={INK} />
          <View
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent"
            style={{ borderWidth: 2, borderColor: "#f5f0eb" }}
          />
        </Pressable>
        <PLAvatar initials="AO" size={40} tone="primary" />
      </View>
    </View>
  );
}

function SearchBar() {
  return (
    <View className="px-5 pt-4 pb-2">
      <View className="bg-cream-2 rounded-full px-4 py-3 flex-row items-center gap-2.5">
        <Ionicons name="search" size={18} color={INK_2} />
        <TextInput
          placeholder="Search address, area, landmark…"
          placeholderTextColor={INK_3}
          className="flex-1 text-sm text-ink font-sans-medium"
          style={{ paddingVertical: 0 }}
        />
        <View className="w-7 h-7 rounded-full bg-ink items-center justify-center">
          <Ionicons name="options-outline" size={14} color="#ffffff" />
        </View>
      </View>
    </View>
  );
}

function ModeSwitcher({
  selected,
  onSelect,
}: {
  selected: Mode;
  onSelect: (m: Mode) => void;
}) {
  return (
    <View className="px-5 pb-3">
      <View className="flex-row bg-cream-2 rounded-full p-1">
        {MODES.map((m) => {
          const isOn = selected === m;
          return (
            <Pressable
              key={m}
              onPress={() => onSelect(m)}
              className={`flex-1 py-2.5 rounded-full items-center ${
                isOn ? "bg-white" : "bg-transparent"
              }`}
              style={
                isOn
                  ? {
                      shadowColor: "#000",
                      shadowOpacity: 0.06,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 1 },
                    }
                  : undefined
              }
            >
              <Text
                className={`text-[13px] font-sans-bold ${
                  isOn ? "text-ink" : "text-ink-3"
                }`}
              >
                {m}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LocationChips({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (loc: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5 pb-4 gap-2"
    >
      {LOCATIONS.map((l) => {
        const isOn = selected === l;
        return (
          <Pressable
            key={l}
            onPress={() => onSelect(l)}
            className={`px-3.5 py-2 rounded-full ${
              isOn ? "bg-ink" : "bg-cream-2"
            }`}
          >
            <Text
              className={`text-[13px] font-sans-semibold ${
                isOn ? "text-white" : "text-ink-2"
              }`}
            >
              {l}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SectionHeader({
  title,
  italic,
  action,
}: {
  title: string;
  italic?: string;
  action?: string;
}) {
  return (
    <View className="px-5 pt-5 flex-row items-baseline justify-between">
      <Text className="text-[17px] font-sans-bold text-ink tracking-tight">
        {italic ? (
          <>
            <Text className="font-serif-italic">{italic}</Text>{" "}
            {title}
          </>
        ) : (
          title
        )}
      </Text>
      {action && (
        <Text className="text-[13px] font-sans-semibold text-primary">
          {action}
        </Text>
      )}
    </View>
  );
}

function FeaturedCarousel({
  items,
}: {
  items: (typeof FEATURED_LEKKI)[number][];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5 pt-3 gap-3.5"
    >
      {items.map((c) => (
        <Pressable
          key={c.id}
          onPress={() =>
            router.push(`/property/${c.id}` as Href)
          }
          className="bg-white rounded-[20px] overflow-hidden active:opacity-90"
          style={{
            width: 256,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <View style={{ height: 170 }} className="relative">
            <Image
              source={picsum(c.imageSeed)}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            {c.tag && (
              <View className="absolute top-3 left-3 bg-white px-2.5 py-1 rounded-full">
                <Text className="text-[11px] font-sans-bold text-ink tracking-wider">
                  {c.tag.toUpperCase()}
                </Text>
              </View>
            )}
            <Pressable className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 items-center justify-center">
              <Ionicons name="heart-outline" size={16} color={INK} />
            </Pressable>
          </View>
          <View className="px-3.5 py-3">
            <View className="flex-row items-baseline gap-1.5">
              <Text className="font-serif text-[20px] text-ink">{c.price}</Text>
              <Text className="text-xs text-ink-3 font-sans-semibold">
                {c.period}
              </Text>
            </View>
            <Text
              className="text-[14px] font-sans-semibold text-ink mt-0.5"
              numberOfLines={1}
            >
              {c.title}
            </Text>
            <Text className="text-xs text-ink-3 mt-0.5">{c.area}</Text>
            <View className="flex-row gap-3 mt-2">
              <View className="flex-row items-center gap-1">
                <Ionicons name="bed-outline" size={14} color={INK_2} />
                <Text className="text-xs font-sans-semibold text-ink-2">
                  {c.beds}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="water-outline" size={14} color={INK_2} />
                <Text className="text-xs font-sans-semibold text-ink-2">
                  {c.baths}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function MarketPulse({ location, all }: { location: string; all: boolean }) {
  return (
    <View className="mt-5 mx-4 bg-ink rounded-[18px] px-5 py-4 overflow-hidden">
      <Text className="text-[10px] font-sans-bold text-white/60 tracking-widest uppercase">
        Market pulse · {location}
      </Text>
      <Text
        className="font-serif text-[22px] text-white mt-1.5"
        style={{ lineHeight: 26 }}
      >
        What <Text className="font-serif-italic">₦3M / yr</Text> rents this
        month
      </Text>
      {all && (
        <Text className="text-xs text-white/60 mt-1">
          Across Lekki, Ikoyi, V.I. &amp; Yaba
        </Text>
      )}
      <View className="flex-row gap-3 mt-4">
        {[
          { n: "+8%", l: "YoY rent", color: "#7ad296" },
          { n: "47", l: "New listings", color: "#ffffff" },
          { n: "22d", l: "Time to let", color: "#ffffff" },
        ].map((s) => (
          <View key={s.l} className="flex-1">
            <Text className="font-serif text-[20px]" style={{ color: s.color }}>
              {s.n}
            </Text>
            <Text className="text-[10px] font-sans-bold text-white/60 mt-0.5 uppercase tracking-widest">
              {s.l}
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row items-center gap-1 mt-3.5">
        <Text
          className="text-xs font-sans-bold"
          style={{ color: "#a8e3c0" }}
        >
          Read the full report
        </Text>
        <Ionicons name="arrow-forward" size={11} color="#a8e3c0" />
      </View>
    </View>
  );
}

function RecentlyViewed() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5 pt-3 gap-2.5"
    >
      {RECENT_ITEMS.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(`/property/${c.id}` as Href)}
          className="bg-white rounded-[14px] overflow-hidden border-line active:opacity-90"
          style={{ width: 180, borderWidth: 0.5 }}
        >
          <Image
            source={picsum(c.imageSeed, 360, 200)}
            style={{ width: "100%", height: 96 }}
            contentFit="cover"
          />
          <View className="px-3 py-2.5">
            <Text className="font-serif text-[16px] text-ink">{c.price}</Text>
            <Text
              className="text-xs font-sans-semibold text-ink mt-0.5"
              numberOfLines={1}
            >
              {c.title}
            </Text>
            <Text className="text-[10.5px] font-sans-semibold text-ink-3 mt-0.5">
              {c.area} · {c.ago}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ServiceLoopSection() {
  return (
    <>
      <View className="px-5 pt-5 flex-row items-baseline justify-between">
        <Text className="text-[17px] text-ink tracking-tight">
          <Text className="font-serif-italic text-[17px]">Service Loop</Text>
          <Text className="font-sans-bold"> · people who fix things</Text>
        </Text>
        <Text className="text-[13px] font-sans-semibold text-primary">
          Browse all
        </Text>
      </View>
      <Text className="px-5 mt-0.5 text-[12.5px] text-ink-3 leading-5">
        Verified vendors · pay through escrow only when the job's done.
      </Text>

      {/* Category tiles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-5 pt-2.5 gap-2.5"
      >
        {SERVICE_CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            className="bg-white rounded-[14px] items-center justify-center gap-1.5 border-line"
            style={{
              width: 76,
              paddingVertical: 14,
              borderWidth: 1,
            }}
          >
            <Ionicons name={c.icon} size={22} color={PRIMARY} />
            <Text className="text-[11.5px] font-sans-bold text-ink">
              {c.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Featured vendor */}
      <View className="px-4 pt-3">
        <View
          className="bg-white rounded-2xl p-3 flex-row items-center gap-3 border-line"
          style={{ borderWidth: 0.5 }}
        >
          <PLAvatar initials={FEATURED_VENDOR.initials} size={48} tone="primary" />
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-[14px] font-sans-bold text-ink">
                {FEATURED_VENDOR.name}
              </Text>
              <Ionicons name="shield-checkmark" size={13} color={PRIMARY} />
              {FEATURED_VENDOR.topRated && (
                <View className="bg-accent-soft px-1.5 py-0.5 rounded-full">
                  <Text
                    className="text-[9.5px] font-sans-bold tracking-widest uppercase"
                    style={{ color: "#6b4a16" }}
                  >
                    Top rated
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-ink-3 mt-0.5">
              {FEATURED_VENDOR.category} · {FEATURED_VENDOR.area} · ⭐{" "}
              {FEATURED_VENDOR.rating} · {FEATURED_VENDOR.jobs} jobs
            </Text>
            <Text className="text-xs text-primary font-sans-bold mt-1">
              From {FEATURED_VENDOR.fromPrice} · book today
            </Text>
          </View>
          <Pressable className="w-9 h-9 rounded-full bg-primary items-center justify-center">
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </>
  );
}

function NearbyList({ items }: { items: typeof NEARBY_LEKKI }) {
  return (
    <View className="px-4 pt-2.5 gap-2.5">
      {items.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => router.push(`/property/${r.id}` as Href)}
          className="flex-row gap-3 p-3 bg-white rounded-2xl active:opacity-90"
        >
          <Image
            source={picsum(r.imageSeed, 200, 200)}
            style={{ width: 96, height: 96, borderRadius: 12 }}
            contentFit="cover"
          />
          <View className="flex-1 justify-center">
            <Text className="text-[11px] font-sans-bold text-primary tracking-wider uppercase">
              {r.area}
            </Text>
            <Text
              className="text-[14.5px] font-sans-semibold text-ink mt-0.5"
              numberOfLines={1}
            >
              {r.title}
            </Text>
            <View className="flex-row gap-2.5 mt-1">
              <Text className="text-xs font-sans-semibold text-ink-3">
                {r.beds} bed
              </Text>
              <Text className="text-xs font-sans-semibold text-ink-3">
                {r.baths} bath
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={11} color={ACCENT} />
                <Text className="text-xs font-sans-semibold text-ink-3">
                  {r.rating}
                </Text>
              </View>
            </View>
            <View className="flex-row items-baseline gap-1 mt-1.5">
              <Text className="font-serif text-[17px] text-ink">{r.price}</Text>
              {r.period ? (
                <Text className="text-[11px] font-sans-semibold text-ink-3">
                  {r.period}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ShortletsSection() {
  return (
    <>
      <View className="px-5 pt-5 flex-row items-baseline justify-between">
        <Text className="text-[17px] text-ink tracking-tight">
          <Text className="font-sans-bold">Weekends in </Text>
          <Text className="font-serif-italic text-[17px]">Lagos</Text>
        </Text>
        <Text className="text-[13px] font-sans-semibold text-primary">
          All shortlets
        </Text>
      </View>
      <Text className="px-5 mt-0.5 text-[12.5px] text-ink-3 leading-5">
        Verified hosts · self check-in · from ₦55,000 a night.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-5 pt-2.5 gap-3.5"
      >
        {SHORTLETS.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/property/${s.id}` as Href)}
            className="bg-white rounded-[18px] overflow-hidden border-line active:opacity-90"
            style={{ width: 240, borderWidth: 0.5 }}
          >
            <View style={{ height: 140 }} className="relative">
              <Image
                source={picsum(s.imageSeed, 500, 320)}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View
                className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full"
                style={{ backgroundColor: "#3c2d5c" }}
              >
                <Text className="text-[10px] font-sans-bold text-white tracking-wider uppercase">
                  Shortlet
                </Text>
              </View>
              {s.superhost && (
                <View className="absolute top-2.5 left-[78px] px-2 py-1 rounded-full bg-white/95">
                  <Text className="text-[10px] font-sans-bold text-ink tracking-wider uppercase">
                    Superhost
                  </Text>
                </View>
              )}
              <View className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded-full bg-black/55 flex-row items-center gap-1">
                <Ionicons name="star" size={10} color={ACCENT} />
                <Text className="text-[11px] font-sans-bold text-white">
                  {s.rating}
                </Text>
              </View>
            </View>
            <View className="px-3 py-3">
              <View className="flex-row items-baseline gap-1">
                <Text className="font-serif text-[18px] text-ink">
                  {s.price}
                </Text>
                <Text className="text-[11px] text-ink-3 font-sans-semibold">
                  / night
                </Text>
              </View>
              <Text
                className="text-[13px] font-sans-bold text-ink mt-0.5"
                numberOfLines={1}
              >
                {s.title}
              </Text>
              <Text className="text-[11.5px] text-ink-3 mt-0.5">{s.area}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

function AgentsSection() {
  return (
    <>
      <View className="px-5 pt-6 flex-row items-baseline justify-between">
        <Text className="text-[17px] font-sans-bold text-ink tracking-tight">
          Talk to the listing agent
        </Text>
        <Text className="text-[13px] font-sans-semibold text-primary">
          Browse 38
        </Text>
      </View>
      <Text className="px-5 mt-0.5 text-[12.5px] text-ink-3 leading-5">
        Every agent on PropertyLoop is KYC-verified. No phone-tree, no chain of brokers.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-5 pt-2.5 gap-2.5"
      >
        {AGENTS.map((a) => (
          <View
            key={a.id}
            className="bg-white rounded-2xl px-3.5 py-3.5 border-line"
            style={{ width: 168, borderWidth: 0.5 }}
          >
            <View className="flex-row items-center gap-2">
              <PLAvatar initials={a.initials} size={36} tone={a.tone} />
              <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
            </View>
            <Text className="text-[13.5px] font-sans-bold text-ink mt-2">
              {a.name}
            </Text>
            <Text className="text-[11px] font-sans-semibold text-ink-3 mt-0.5">
              {a.description}
            </Text>
            <View className="flex-row items-center gap-1 mt-1.5">
              <Ionicons name="star" size={11} color={ACCENT} />
              <Text className="text-[11px] font-sans-bold text-ink">
                {a.rating}
              </Text>
              <Text className="text-[11px] font-sans-semibold text-ink-3 ml-1">
                · {a.listings} listings
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

function LogbookTeaser() {
  return (
    <View className="mt-6 mx-4 bg-primary-soft rounded-[18px] p-5">
      <Text className="text-[11px] font-sans-bold text-primary tracking-widest uppercase">
        Property Logbook
      </Text>
      <Text
        className="font-serif text-[24px] mt-1.5"
        style={{ color: PRIMARY_INK, lineHeight: 28 }}
      >
        Every home, <Text className="font-serif-italic">an honest record</Text>
      </Text>
      <Text
        className="text-[13px] mt-1.5 leading-5"
        style={{ color: PRIMARY_INK, opacity: 0.78 }}
      >
        Repairs, inspections, service receipts — a permanent history that
        follows the property.
      </Text>

      {/* Mini-logbook preview */}
      <View className="mt-3.5 bg-white rounded-xl px-3 py-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-sans-bold text-ink-2">
            {LOGBOOK_PREVIEW.propertyName}
          </Text>
          <Text className="text-[10px] font-sans-bold text-primary tracking-widest uppercase">
            {LOGBOOK_PREVIEW.since}
          </Text>
        </View>
        <View className="mt-2 gap-1">
          {LOGBOOK_PREVIEW.events.map((e) => (
            <View key={e.label} className="flex-row items-center gap-2">
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 5,
                  backgroundColor:
                    e.tone === "primary"
                      ? PRIMARY
                      : e.tone === "accent"
                        ? ACCENT
                        : INK_3,
                }}
              />
              <Text className="text-[11.5px] text-ink-2 flex-1">{e.label}</Text>
              <Text className="text-[11.5px] text-ink-3 font-sans-medium">
                {e.date}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable className="mt-3.5 self-start bg-primary rounded-full px-4 py-2.5 flex-row items-center gap-1.5">
        <Text className="text-[12.5px] font-sans-bold text-white">
          How it works
        </Text>
        <Ionicons name="arrow-forward" size={12} color="#ffffff" />
      </Pressable>
    </View>
  );
}

function ContactCard() {
  return (
    <View
      className="mt-6 mx-4 bg-white rounded-[14px] px-4 py-3.5 flex-row items-center gap-3 border-line"
      style={{ borderWidth: 0.5 }}
    >
      <View
        className="w-[38px] h-[38px] rounded-[10px] items-center justify-center"
        style={{ backgroundColor: SURFACE_2 }}
      >
        <Ionicons name="call-outline" size={18} color={INK_2} />
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-sans-bold text-ink">
          {CONTACT.title}
        </Text>
        <Text className="text-[11.5px] text-ink-3 mt-0.5">
          {CONTACT.subtitle}
        </Text>
      </View>
      <Pressable
        onPress={() => Linking.openURL(`tel:${CONTACT.phone}`)}
        hitSlop={8}
      >
        <Text className="text-xs font-sans-bold text-primary">Call</Text>
      </Pressable>
    </View>
  );
}
