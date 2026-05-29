// Mock for the B2 sale-variant listing detail. Mirrors "Hibiscus House"
// from the design bundle. When the backend is reconnected this becomes
// `await listingsService.getById(id)` and the helper functions go away.

import type { Ionicons } from "@expo/vector-icons";

type IonName = keyof typeof Ionicons.glyphMap;

export type SaleListing = {
  id: string;
  title: string;
  address: string;
  area: string;
  daysOnMarket: number;
  verified: boolean;
  priceNaira: number;
  priceLabel: string;
  pricePerSqm: string;
  areaMedianPerSqm: string;
  openToOffers: boolean;
  /** Picsum seeds for the gallery — first one drives the hero. */
  imageSeeds: string[];
  stats: { icon: IonName; n: string; l: string }[];
  neighbourhood: { l: string; n: string; s: string }[];
  agent: {
    initials: string;
    name: string;
    agency: string;
    sales: number;
    rating: string;
    tone: "primary" | "accent";
  };
};

export const HIBISCUS_HOUSE: SaleListing = {
  id: "hibiscus-house",
  title: "Hibiscus House · 4-bed detached",
  address: "17 Admiralty Way, Lekki Phase 1, Lagos",
  area: "Lekki Phase 1",
  daysOnMarket: 4,
  verified: true,
  priceNaira: 78_000_000,
  priceLabel: "₦78,000,000",
  pricePerSqm: "₦243k/m²",
  areaMedianPerSqm: "₦258k/m²",
  openToOffers: true,
  imageSeeds: [
    "hibiscus-1",
    "hibiscus-2",
    "hibiscus-3",
    "hibiscus-4",
    "hibiscus-5",
    "hibiscus-6",
  ],
  stats: [
    { icon: "bed-outline",      n: "4",   l: "Bed" },
    { icon: "water-outline",    n: "4",   l: "Bath" },
    { icon: "resize-outline",   n: "320", l: "m²" },
    { icon: "car-outline",      n: "3",   l: "Park" },
  ],
  neighbourhood: [
    { l: "Schools",   n: "14",   s: "Within 2 km" },
    { l: "Hospitals", n: "4",    s: "Within 3 km" },
    { l: "Avg ₦/m²",  n: "258k", s: "Lekki P1" },
  ],
  agent: {
    initials: "EA",
    name: "Emeka Adeyemi",
    agency: "Loop Realty",
    sales: 42,
    rating: "4.9",
    tone: "accent",
  },
};

/** Looked up by id; falls back to Hibiscus House so the screen always renders. */
export const getSaleListing = (_id?: string): SaleListing => HIBISCUS_HOUSE;
