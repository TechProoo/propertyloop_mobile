import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { PLAvatar } from "@/components/brand/PLAvatar";

const PRIMARY = "#1f6f43";
const INK_2 = "#4d524f";
const INK_3 = "#7f857f";

type Tone = "primary" | "accent" | "neutral";
type Contact = {
  id: string;
  initials: string;
  name: string;
  role: string;
  detail: string;
  tone: Tone;
  verified?: boolean;
  recent?: boolean;
};

const CONTACTS: Contact[] = [
  { id: "chinwe",  initials: "CN", name: "Chinwe Nwosu",    role: "Listing agent · Sandbridge Court", detail: "Replies in ~20 min", tone: "accent",  verified: true, recent: true },
  { id: "emeka",   initials: "EA", name: "Emeka Adeyemi",   role: "Listing agent · Hibiscus House",   detail: "Online now",         tone: "primary", verified: true, recent: true },
  { id: "bilkisu", initials: "BI", name: "Bilkisu Ibrahim", role: "Listing agent · Cedar Court 14",   detail: "Replies in ~1 hr",   tone: "primary", verified: true },
  { id: "tope",    initials: "TB", name: "Tope Bassey",      role: "Listing agent · The Loom House",   detail: "Replies same day",   tone: "accent",  verified: true },
  { id: "sparkle", initials: "SC", name: "Sparkle & Co.",    role: "Vendor · Cleaning",                detail: "Open Mon–Sat",       tone: "primary", verified: true },
  { id: "bright",  initials: "BS", name: "Bright Sparks Ltd", role: "Vendor · Electrical",             detail: "Open today",         tone: "accent",  verified: true },
  { id: "support", initials: "PL", name: "PropertyLoop support", role: "Help team",                    detail: "Avg reply 12 min",   tone: "neutral", verified: true },
];

export default function NewMessageScreen() {
  const [query, setQuery] = useState("");

  const recent = useMemo(() => CONTACTS.filter((c) => c.recent), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONTACTS;
    return CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q),
    );
  }, [query]);

  const onTap = (c: Contact) => router.replace(`/conversation/${c.id}` as Href);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-cream-2 items-center justify-center"
        >
          <Ionicons name="close" size={18} color={INK_2} />
        </Pressable>
        <Text className="text-[15px] font-sans-bold text-ink">New message</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View className="px-5 pt-2">
        <View
          className="bg-white rounded-full px-3.5 py-2.5 flex-row items-center gap-2.5 border-line"
          style={{ borderWidth: 1 }}
        >
          <Ionicons name="search" size={16} color={INK_2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search agents, vendors, support"
            placeholderTextColor={INK_3}
            className="flex-1 text-[14px] text-ink"
            style={{ fontFamily: "Inter_500Medium", paddingVertical: 0 }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={INK_3} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {query.trim().length === 0 && recent.length > 0 && (
          <>
            <SectionLabel>Recent</SectionLabel>
            <View className="px-2 pt-1">
              {recent.map((c) => (
                <ContactRow key={c.id} contact={c} onPress={() => onTap(c)} />
              ))}
            </View>
          </>
        )}

        <SectionLabel>
          {query.trim().length === 0 ? "All contacts" : `Results · ${filtered.length}`}
        </SectionLabel>
        <View className="px-2 pt-1">
          {filtered.length === 0 ? (
            <Text className="text-[13px] text-ink-3 px-3 py-6 text-center">
              No matches for "{query}".
            </Text>
          ) : (
            filtered.map((c) => (
              <ContactRow key={c.id} contact={c} onPress={() => onTap(c)} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[11px] font-sans-bold text-ink-3 tracking-widest uppercase mt-5 mb-1.5 px-5">
      {children}
    </Text>
  );
}

function ContactRow({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-3 py-2.5 rounded-2xl active:bg-cream-2"
    >
      <PLAvatar initials={contact.initials} size={42} tone={contact.tone} />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[14px] font-sans-bold text-ink">{contact.name}</Text>
          {contact.verified && (
            <Ionicons name="shield-checkmark" size={12} color={PRIMARY} />
          )}
        </View>
        <Text className="text-[11.5px] text-ink-3 mt-0.5" numberOfLines={1}>
          {contact.role}
        </Text>
        <Text className="text-[11px] text-ink-3 mt-0.5">{contact.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={INK_3} />
    </Pressable>
  );
}
