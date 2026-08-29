import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { FeedAuthor, FeedPostType } from "@/api/services/feed";

export const PRIMARY = "#1f6f43";
export const PRIMARY_SOFT = "#e3efe7";
export const PRIMARY_INK = "#134a2d";
export const ACCENT = "#b9842c";
export const INK = "#1a2120";
export const INK_2 = "#4d524f";
export const INK_3 = "#7f857f";
export const LINE = "#e1dcd3";
export const SURFACE_2 = "#f0f0f0";

export const ROLE_LABEL: Record<string, string> = {
  AGENT: "Agent",
  VENDOR: "Vendor",
  BUYER: "Buyer",
  ADMIN: "PropertyLoop",
};

/** Mirrors the web ROLE_PILL classes, resolved to raw colours for RN. */
export const ROLE_PILL: Record<string, { bg: string; fg: string }> = {
  AGENT: { bg: PRIMARY_SOFT, fg: PRIMARY_INK },
  VENDOR: { bg: "#fdeede", fg: "#9a5a16" },
  BUYER: { bg: "#e4eef7", fg: "#245a82" },
  ADMIN: { bg: SURFACE_2, fg: INK_2 },
};

export const TYPE_TAG: Partial<
  Record<FeedPostType, { label: string; color: string; icon: "trending-up" | "business" }>
> = {
  INSIGHT: { label: "Market insight", color: ACCENT, icon: "trending-up" },
  PROJECT: { label: "Completed project", color: PRIMARY, icon: "business" },
  TIP: { label: "Property tip", color: "#8b54a8", icon: "trending-up" },
  NEWS: { label: "Industry news", color: "#245a82", icon: "trending-up" },
};

export const timeAgo = (iso: string) => {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
};

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Post body with #hashtags picked out, matching the web HashBody split. */
export function HashBody({
  text,
  onHashtag,
}: {
  text: string;
  onHashtag?: (tag: string) => void;
}) {
  return (
    <Text className="text-ink text-[15.5px] leading-6">
      {text.split(/(#[A-Za-z]\w*)/g).map((part, i) =>
        part.startsWith("#") ? (
          <Text
            key={i}
            className="text-primary font-sans-bold"
            onPress={onHashtag ? () => onHashtag(part.slice(1)) : undefined}
          >
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

export function Avatar({
  author,
  size = 48,
  onPress,
}: {
  author: { name: string; avatarUrl: string | null };
  size?: number;
  onPress?: () => void;
}) {
  const inner = author.avatarUrl ? (
    <Image
      source={{ uri: author.avatarUrl }}
      style={{ width: size, height: size }}
      contentFit="cover"
    />
  ) : (
    <Text
      className="font-sans-bold"
      style={{ color: PRIMARY_INK, fontSize: size * 0.32 }}
    >
      {initials(author.name)}
    </Text>
  );

  const body = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: SURFACE_2,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {inner}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      {body}
    </Pressable>
  );
}

export function RolePill({ role }: { role: string }) {
  const tone = ROLE_PILL[role] ?? ROLE_PILL.ADMIN;
  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{ backgroundColor: tone.bg }}
    >
      <Text
        className="text-[10px] font-sans-bold uppercase"
        style={{ color: tone.fg, letterSpacing: 0.4 }}
      >
        {ROLE_LABEL[role] ?? role}
      </Text>
    </View>
  );
}

/** "Agency · Location · 4h" — the web subtitle, same ordering and separators. */
export function authorSubtitle(author: FeedAuthor, createdAt: string) {
  return [author.agency || author.serviceCategory, author.location, timeAgo(createdAt)]
    .filter(Boolean)
    .join(" · ");
}

export function VerifiedTick({ size = 15 }: { size?: number }) {
  return <Ionicons name="checkmark-circle" size={size} color={PRIMARY} />;
}
