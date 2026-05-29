// Buyer dashboard / offers / purchase progress mocks. Maps to the
// design's B12, B4 and B5 screens. Each constant has the shape the
// backend would eventually return.

import type { Ionicons } from "@expo/vector-icons";

type IonName = keyof typeof Ionicons.glyphMap;

// ─── Dashboard hero (B12) ──────────────────────────────────────
export const DASHBOARD_HERO = {
  initials: "AO",
  greeting: "Hi Adebayo",
  stats: [
    { n: "12", l: "Saved" },
    { n: "3",  l: "Viewings" },
    { n: "2",  l: "Offers" },
    { n: "1",  l: "Closing" },
  ],
};

// ─── "Up next" cards on the dashboard ──────────────────────────
export type UpNextTone = "primary" | "accent" | "neutral";

export type UpNextItem = {
  id: string;
  tone: UpNextTone;
  tag: string;
  title: string;
  detail: string;
  cta: string;
  icon: IonName;
  /** Pathname to push when CTA tapped. */
  href: string;
};

export const UP_NEXT: UpNextItem[] = [
  {
    id: "viewing-tomorrow",
    tone: "primary",
    tag: "Viewing · tomorrow",
    title: "Sandbridge Court · 10:00 AM",
    detail: "Chinwe will meet you at the lobby",
    cta: "Open",
    icon: "calendar-outline",
    href: "/book-viewing",
  },
  {
    id: "sign-title-search",
    tone: "accent",
    tag: "Action needed",
    title: "Sign title-search authorisation",
    detail: "Cedar Court · purchase step 3",
    cta: "Sign",
    icon: "document-text-outline",
    href: "/purchase-progress",
  },
  {
    id: "counter-offer",
    tone: "neutral",
    tag: "Counter offer",
    title: "Hibiscus House · seller responded",
    detail: "₦75.5M counter on your ₦72.5M",
    cta: "Review",
    icon: "swap-horizontal-outline",
    href: "/offers",
  },
];

// ─── Saved searches ───────────────────────────────────────────
export type SavedSearch = {
  id: string;
  title: string;
  detail: string;
  homes: string;
  newCount?: number;
};

export const SAVED_SEARCHES: SavedSearch[] = [
  { id: "ss-1", title: "Buy · Lekki",     detail: "₦60M – ₦150M · 3+ bed",   homes: "142", newCount: 3 },
  { id: "ss-2", title: "Rent · Yaba",     detail: "≤ ₦3M/yr · 2 bed",        homes: "38" },
  { id: "ss-3", title: "Shortlet · V.I.", detail: "weekend stays · ≤ ₦100k/n", homes: "64", newCount: 7 },
];

// ─── Service Loop open jobs on dashboard ──────────────────────
export type ServiceJobStatus = "escrow" | "confirm";

export type ServiceJob = {
  id: string;
  vendor: string;
  category: string;
  detail: string;
  amount: string;
  status: ServiceJobStatus;
  statusLabel: string;
};

export const SERVICE_JOBS: ServiceJob[] = [
  {
    id: "sj-1",
    vendor: "Sparkle & Co.",
    category: "Standard clean",
    detail: "Tomorrow · 10am",
    amount: "₦18,000",
    status: "escrow",
    statusLabel: "In escrow",
  },
  {
    id: "sj-2",
    vendor: "Bright Sparks Ltd",
    category: "Generator service",
    detail: "Job done · awaiting your confirm",
    amount: "₦42,000",
    status: "confirm",
    statusLabel: "Confirm to release",
  },
];

// ─── Offers (B4) ──────────────────────────────────────────────
export type OfferStatus = "pending" | "counter" | "accepted";

export type Offer = {
  id: string;
  status: OfferStatus;
  home: string;
  area: string;
  asking: string;
  yours: string;
  counter?: string;
  since: string;
  agent: string;
  deadline?: string;
  imageSeed: string;
};

export const OFFERS: Offer[] = [
  {
    id: "off-1",
    status: "counter",
    home: "Hibiscus House · 4-bed",
    area: "Lekki Phase 1",
    asking: "₦78M",
    yours: "₦72.5M",
    counter: "₦75.5M",
    since: "2 days ago",
    agent: "Emeka Adeyemi",
    imageSeed: "hibiscus-1",
  },
  {
    id: "off-2",
    status: "pending",
    home: "The Loom House · 4-bed",
    area: "Old Ikoyi",
    asking: "₦125M",
    yours: "₦112M",
    since: "6 hrs ago",
    agent: "Tope Bassey",
    deadline: "22h left",
    imageSeed: "feat-2",
  },
  {
    id: "off-3",
    status: "accepted",
    home: "Cedar Court 14 · 3-bed",
    area: "Magodo GRA II",
    asking: "₦62M",
    yours: "₦58M",
    since: "1 week ago",
    agent: "Bilkisu I.",
    imageSeed: "cedar",
  },
];

export const OFFERS_STAT_STRIP = [
  { n: "3",    l: "Active offers",   tone: "primary" as const },
  { n: "1",    l: "Awaiting reply" },
  { n: "₦72M", l: "Total committed" },
];

// ─── Purchase progress (B5) ───────────────────────────────────
export type PurchaseStepState = "done" | "active" | "todo";

export type PurchaseStep = {
  n: string;
  state: PurchaseStepState;
  title: string;
  detail: string;
  eta?: string;
};

export const PURCHASE = {
  property: {
    name: "Cedar Court 14 · 3-bed",
    area: "₦58,000,000 · Magodo GRA II",
    status: "Under contract",
    imageSeed: "cedar",
  },
  stepNumber: 3,
  totalSteps: 5,
  progressPct: 0.42,
  blurb: "Title search is underway. Average completion in 14 days.",
  steps: [
    { n: "1", state: "done"   as const, title: "Offer accepted",            detail: "Seller accepted ₦58M · 4 days ago" },
    { n: "2", state: "done"   as const, title: "Solicitors instructed",     detail: "Both sides confirmed legal counsel" },
    { n: "3", state: "active" as const, title: "Title search & due diligence", detail: "C of O verified · survey pending", eta: "5 days" },
    { n: "4", state: "todo"   as const, title: "Property inspection",       detail: "Structural · book inspector" },
    { n: "5", state: "todo"   as const, title: "Completion & handover",     detail: "Sign deed off-platform, collect keys" },
  ] as PurchaseStep[],
  pendingAction: {
    title: "1 document needs your signature",
    detail: "Title search authorisation · due tomorrow",
  },
  team: [
    { name: "Bilkisu Ibrahim", role: "Listing agent",  initials: "BI", tone: "accent"  as const },
    { name: "Adaeze Okoye",    role: "Your solicitor", initials: "AO", tone: "primary" as const },
  ],
};
