// Service Loop marketplace + booking mocks. Maps to B10 / B11.

import type { Ionicons } from "@expo/vector-icons";

type IonName = keyof typeof Ionicons.glyphMap;

// ─── 4x2 category grid on the marketplace ─────────────────────
export type ServiceCategory = {
  id: string;
  label: string;
  icon: IonName;
};

export const SERVICE_CATEGORIES_GRID: ServiceCategory[] = [
  { id: "plumbing",  label: "Plumbing",  icon: "water-outline" },
  { id: "electric",  label: "Electric",  icon: "flash-outline" },
  { id: "cleaning",  label: "Cleaning",  icon: "sparkles-outline" },
  { id: "carpentry", label: "Carpentry", icon: "hammer-outline" },
  { id: "painting",  label: "Painting",  icon: "color-palette-outline" },
  { id: "ac",        label: "A/C",       icon: "snow-outline" },
  { id: "garden",    label: "Garden",    icon: "leaf-outline" },
  { id: "movers",    label: "Movers",    icon: "cube-outline" },
];

// ─── Vendors shown under the active category ────────────────
export type Vendor = {
  id: string;
  initials: string;
  name: string;
  category: string;
  rating: string;
  jobs: number;
  price: string;
  verified: boolean;
  tone: "primary" | "accent";
  tag?: string;
};

export const CLEANING_VENDORS: Vendor[] = [
  {
    id: "sparkle",
    initials: "SC",
    name: "Sparkle & Co.",
    category: "Deep clean · post-construction",
    rating: "4.9",
    jobs: 287,
    price: "from ₦18,000",
    verified: true,
    tone: "primary",
    tag: "Top rated",
  },
  {
    id: "kemi",
    initials: "KC",
    name: "Kemi Cleans NG",
    category: "Weekly housekeeping · Lekki/Ikoyi",
    rating: "4.8",
    jobs: 142,
    price: "₦8,500 / visit",
    verified: true,
    tone: "accent",
  },
  {
    id: "greenleaf",
    initials: "GL",
    name: "GreenLeaf Cleaners",
    category: "Eco-friendly products · 2-person team",
    rating: "4.7",
    jobs: 98,
    price: "from ₦14,000",
    verified: false,
    tone: "primary",
  },
];

// ─── Service tiers on the booking screen ──────────────────────
export type ServiceTier = {
  id: string;
  label: string;
  priceNaira: number;
  priceLabel: string;
};

export const SERVICE_TIERS: ServiceTier[] = [
  { id: "standard", label: "Standard clean · 2-3 hrs",         priceNaira: 18_000, priceLabel: "₦18,000" },
  { id: "deep",     label: "Deep clean · 4-6 hrs",             priceNaira: 35_000, priceLabel: "₦35,000" },
  { id: "post",     label: "Post-construction · all day",      priceNaira: 65_000, priceLabel: "₦65,000" },
];

// ─── When chips on the booking screen ─────────────────────────
export type WhenChip = {
  id: string;
  date: string;
  detail: string;
};

export const WHEN_CHIPS: WhenChip[] = [
  { id: "today",    date: "Today",    detail: "After 4pm" },
  { id: "tomorrow", date: "Tomorrow", detail: "Any time" },
  { id: "sat-30",   date: "Sat 30",   detail: "3 slots" },
  { id: "sun-31",   date: "Sun 31",   detail: "Any time" },
];

// ─── Stub address (would normally come from the user profile) ─
export const BOOKING_ADDRESS = {
  unit: "Sandbridge Court · Flat 4B",
  detail: "Admiralty Way, Lekki Phase 1",
};
