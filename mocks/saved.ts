// Saved-tab mock data. Mirrors the design's "Your shortlist" screen.

export type SavedListing = {
  id: string;
  price: string;
  title: string;
  area: string;
  savedAt: string;
  /** Italic Playfair note shown below the card body, brand-accent strip. */
  note?: string;
  /** When present, shows a "Price ↓ X%" pill on the price row. */
  priceDropPct?: number;
  imageSeed: string;
};

export const SAVED_LISTINGS: SavedListing[] = [
  {
    id: "sv-1",
    price: "₦4.8M",
    title: "Sandbridge Court · 3-bed",
    area: "Lekki Phase 1",
    savedAt: "Saved 2 days ago",
    note: "Looks great — viewing Sat 10am.",
    priceDropPct: 8,
    imageSeed: "feat-1",
  },
  {
    id: "sv-2",
    price: "₦12M",
    title: "The Loom House · 4-bed",
    area: "Old Ikoyi",
    savedAt: "Saved 5 days ago",
    imageSeed: "feat-2",
  },
  {
    id: "sv-3",
    price: "₦2.4M",
    title: "Marlin Studios · 1-bed",
    area: "V.I.",
    savedAt: "Saved 1 week ago",
    note: "Compare with Marina One.",
    imageSeed: "feat-3",
  },
];

// Tabs at the top filter saved cards by area. Counts mirror the
// hardcoded design — replace with derived counts when wiring real data.
export const SAVED_TABS = [
  { id: "all",    label: "All",    count: 12 },
  { id: "lekki",  label: "Lekki",  count: 5 },
  { id: "ikoyi",  label: "Ikoyi",  count: 3 },
  { id: "vi",     label: "V.I.",   count: 4 },
] as const;
