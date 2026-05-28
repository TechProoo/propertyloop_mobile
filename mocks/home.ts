// Mock data for the rich Home tab. Backend is intentionally not
// connected (per project decision); when re-wiring, replace each
// constant with a query against the matching API service.

import type { Ionicons } from "@expo/vector-icons";

type IonName = keyof typeof Ionicons.glyphMap;

// ─── Featured listings carousel ─────────────────────────────────
export type FeaturedListing = {
  id: string;
  price: string;
  period: string;
  title: string;
  area: string;
  beds: number;
  baths: number;
  tag?: "Verified" | "New";
  /** Picsum seed so the mock photo is deterministic. */
  imageSeed: string;
};

export const FEATURED_LEKKI: FeaturedListing[] = [
  { id: "f1", price: "₦4.8M", period: "/yr", title: "Sandbridge Court", area: "Lekki Phase 1", beds: 3, baths: 3, tag: "Verified", imageSeed: "feat-1" },
  { id: "f2", price: "₦12M", period: "/yr", title: "The Loom House", area: "Old Ikoyi", beds: 4, baths: 5, tag: "New", imageSeed: "feat-2" },
  { id: "f3", price: "₦2.4M", period: "/yr", title: "Marlin Studios", area: "V.I.", beds: 1, baths: 1, imageSeed: "feat-3" },
];

export const FEATURED_ALL: FeaturedListing[] = [
  ...FEATURED_LEKKI,
  { id: "f4", price: "₦1.8M", period: "/yr", title: "Adesoji Court", area: "Yaba", beds: 2, baths: 1, imageSeed: "feat-4" },
];

// ─── Recently viewed (Pick up where you left off) ───────────────
export type RecentItem = {
  id: string;
  price: string;
  title: string;
  area: string;
  ago: string;
  imageSeed: string;
};

export const RECENT_ITEMS: RecentItem[] = [
  { id: "r1", price: "₦4.8M", title: "Sandbridge Court", area: "Lekki P1", ago: "2h ago", imageSeed: "rec-1" },
  { id: "r2", price: "₦12M", title: "The Loom House", area: "Old Ikoyi", ago: "Yesterday", imageSeed: "rec-2" },
  { id: "r3", price: "₦65k/n", title: "Marlin Studios", area: "V.I.", ago: "3 days ago", imageSeed: "rec-3" },
  { id: "r4", price: "₦3.5M", title: "Foreshore Mews", area: "Lekki", ago: "4 days ago", imageSeed: "rec-4" },
];

// ─── Near your search (vertical list) ───────────────────────────
export type NearbyRow = {
  id: string;
  price: string;
  period: string;
  title: string;
  area: string;
  beds: number;
  baths: number;
  rating: string;
  imageSeed: string;
};

export const NEARBY_LEKKI: NearbyRow[] = [
  { id: "n1", price: "₦3.5M", period: "/yr", title: "Foreshore Mews · 2BR", area: "Lekki · 1.2 km", beds: 2, baths: 2, rating: "4.9", imageSeed: "near-1" },
  { id: "n2", price: "₦1.8M", period: "/yr", title: "Adesoji Court · Mini-flat", area: "Yaba · 4.0 km", beds: 2, baths: 1, rating: "4.7", imageSeed: "near-2" },
];

export const NEARBY_ALL: NearbyRow[] = [
  { id: "n1", price: "₦3.5M", period: "/yr", title: "Foreshore Mews · 2BR", area: "Lekki · listed today", beds: 2, baths: 2, rating: "4.9", imageSeed: "near-1" },
  { id: "n3", price: "₦2.1M", period: "/yr", title: "Bode Thomas Loft", area: "Surulere · 2h ago", beds: 1, baths: 1, rating: "4.8", imageSeed: "near-3" },
  { id: "n4", price: "₦95M", period: "", title: "Maitama Villa 12", area: "Maitama, Abuja · 1d", beds: 5, baths: 6, rating: "4.95", imageSeed: "near-4" },
  { id: "n2", price: "₦1.8M", period: "/yr", title: "Adesoji Court · Mini", area: "Yaba · yesterday", beds: 2, baths: 1, rating: "4.7", imageSeed: "near-2" },
];

// ─── Service Loop categories (tile row) ─────────────────────────
export type ServiceCategory = {
  id: string;
  label: string;
  icon: IonName;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "plumbing",   label: "Plumbing",  icon: "water-outline" },
  { id: "electric",   label: "Electric",  icon: "flash-outline" },
  { id: "cleaning",   label: "Cleaning",  icon: "sparkles-outline" },
  { id: "ac",         label: "A/C",       icon: "snow-outline" },
  { id: "carpentry",  label: "Carpentry", icon: "hammer-outline" },
  { id: "painting",   label: "Painting",  icon: "color-palette-outline" },
  { id: "inspector",  label: "Inspector", icon: "search-outline" },
  { id: "movers",     label: "Movers",    icon: "cube-outline" },
];

// ─── Featured vendor (single card under categories) ─────────────
export const FEATURED_VENDOR = {
  id: "v1",
  initials: "SC",
  name: "Sparkle & Co.",
  category: "Cleaning",
  area: "Lekki",
  rating: "4.9",
  jobs: 287,
  fromPrice: "₦18,000",
  topRated: true,
};

// ─── Shortlets carousel ─────────────────────────────────────────
export type ShortletCard = {
  id: string;
  price: string;
  title: string;
  area: string;
  rating: string;
  superhost?: boolean;
  imageSeed: string;
};

export const SHORTLETS: ShortletCard[] = [
  { id: "s1", price: "₦95k",  title: "Marlin Studios",  area: "V.I. · Eko Atlantic", rating: "4.92", superhost: true, imageSeed: "short-1" },
  { id: "s2", price: "₦140k", title: "Banana Loft 7B",  area: "Banana Island",        rating: "4.97", imageSeed: "short-2" },
  { id: "s3", price: "₦55k",  title: "The Yaba Loft",   area: "Yaba",                 rating: "4.86", imageSeed: "short-3" },
];

// ─── Verified agents carousel ───────────────────────────────────
export type AgentCard = {
  id: string;
  initials: string;
  name: string;
  description: string;
  rating: string;
  listings: number;
  tone: "primary" | "accent";
};

export const AGENTS: AgentCard[] = [
  { id: "a1", initials: "CN", name: "Chinwe Nwosu",   description: "Lekki, Ikoyi",       rating: "4.95", listings: 14, tone: "accent" },
  { id: "a2", initials: "EA", name: "Emeka Adeyemi",  description: "Sales · Lekki",      rating: "4.92", listings: 22, tone: "primary" },
  { id: "a3", initials: "BI", name: "Bilkisu Ibrahim",description: "Abuja · Maitama",    rating: "4.89", listings: 9,  tone: "accent" },
  { id: "a4", initials: "TB", name: "Tope Bassey",    description: "V.I. · Shortlets",   rating: "4.91", listings: 18, tone: "primary" },
];

// ─── Logbook teaser preview ─────────────────────────────────────
export const LOGBOOK_PREVIEW = {
  propertyName: "Sandbridge Court",
  since: "Since 2019",
  events: [
    { label: "Plumbing replaced", date: "12 Mar", tone: "primary" as const },
    { label: "A/C serviced",      date: "04 Jan", tone: "accent" as const },
    { label: "Roof inspection",   date: "Oct 24", tone: "neutral" as const },
  ],
};

// ─── Contact card ───────────────────────────────────────────────
export const CONTACT = {
  title: "Need help finding a home?",
  subtitle: "+234 705 305 3040 · 9am–6pm WAT",
  phone: "+2347053053040",
};

// ─── Location chips ─────────────────────────────────────────────
export const LOCATIONS = ["All", "Lekki", "Ikoyi", "Ikeja", "Yaba", "V.I.", "Maitama"];

// ─── Mode switcher ──────────────────────────────────────────────
export const MODES = ["Rent", "Buy", "Shortlet"] as const;
export type Mode = (typeof MODES)[number];
