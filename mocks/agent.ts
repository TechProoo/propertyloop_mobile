// Mocks for the agent role. Each constant matches what the backend
// would eventually return for the logged-in agent.

import type { Ionicons } from "@expo/vector-icons";

type IonName = keyof typeof Ionicons.glyphMap;

// ─── Agent profile ─────────────────────────────────────────────
export const AGENT = {
  id: "agent-emeka",
  initials: "EA",
  name: "Emeka Adeyemi",
  agency: "Loop Realty Lagos",
  license: "NIESV/L/3492-A",
  area: "Lekki · Ikoyi · V.I.",
  languages: "EN, YO, IG",
  yearsExperience: 8,
  rating: 4.9,
  reviews: 142,
  verified: true,
  founding: true,
  bio:
    "Lekki specialist focused on 3-5 bed family homes. Helped 60+ families relocate to Lagos in the past three years. Known for honest pricing and patient negotiation.",
  specialties: ["Sales", "Rentals", "Luxury"],
  closingsThisYear: 14,
  joinedYear: 2023,
};

// ─── Dashboard ─────────────────────────────────────────────────
export const AGENT_HERO = {
  greeting: "Good morning, Emeka",
  todayLabel: "Saturday · 31 May",
  stats: [
    { n: "12", l: "Active listings" },
    { n: "4",  l: "New leads"        },
    { n: "2",  l: "Viewings today"   },
    { n: "1",  l: "Offer in"         },
  ],
};

export type DashboardAction = {
  id: string;
  tone: "primary" | "accent" | "neutral";
  tag: string;
  title: string;
  detail: string;
  cta: string;
  icon: IonName;
  href?: string;
};

export const AGENT_UP_NEXT: DashboardAction[] = [
  {
    id: "viewing-1000",
    tone: "primary",
    tag: "Viewing · 10:00 AM",
    title: "Adebayo Okafor · Sandbridge Court",
    detail: "Confirmed · he'll meet you at the gate",
    cta: "Open",
    icon: "calendar-outline",
    href: "/(agent-tabs)/leads",
  },
  {
    id: "offer-hibiscus",
    tone: "accent",
    tag: "Action needed",
    title: "New offer · Hibiscus House",
    detail: "₦72.5M on your ₦78M asking — 22h to respond",
    cta: "Review",
    icon: "swap-horizontal-outline",
    href: "/(agent-tabs)/leads",
  },
  {
    id: "lead-cedar",
    tone: "neutral",
    tag: "Lead · 12m ago",
    title: "Bilkisu I. asked about Cedar Court 14",
    detail: "First-time buyer · Magodo GRA II preferences",
    cta: "Reply",
    icon: "chatbubble-outline",
    href: "/(agent-tabs)/inbox",
  },
];

// ─── Listings (agent view) ─────────────────────────────────────
export type ListingStatus = "live" | "draft" | "under_offer" | "let" | "archived";

export type AgentListing = {
  id: string;
  imageSeed: string;
  title: string;
  area: string;
  price: string;
  status: ListingStatus;
  beds: number;
  baths: number;
  views: number;
  saves: number;
  inquiries: number;
  daysLive: number;
  featured?: boolean;
};

export const STATUS_META: Record<
  ListingStatus,
  { label: string; tone: "primary" | "accent" | "neutral" | "ink" }
> = {
  live:         { label: "Live",         tone: "primary" },
  draft:        { label: "Draft",        tone: "neutral" },
  under_offer:  { label: "Under offer",  tone: "accent"  },
  let:          { label: "Let",          tone: "ink"     },
  archived:     { label: "Archived",     tone: "neutral" },
};

export const AGENT_LISTINGS: AgentListing[] = [
  { id: "al-1", imageSeed: "hibiscus-1", title: "Hibiscus House · 4-bed", area: "Lekki Phase 1",    price: "₦78M",     status: "under_offer", beds: 4, baths: 4, views: 1240, saves: 86, inquiries: 18, daysLive: 22, featured: true },
  { id: "al-2", imageSeed: "sand-2",     title: "Sandbridge Court · 3-bed", area: "Lekki Phase 1", price: "₦4.8M/yr", status: "live",        beds: 3, baths: 3, views: 880,  saves: 41, inquiries: 12, daysLive: 14 },
  { id: "al-3", imageSeed: "cedar",      title: "Cedar Court 14 · 3-bed",  area: "Magodo GRA II",  price: "₦62M",     status: "live",        beds: 3, baths: 4, views: 532,  saves: 22, inquiries: 6,  daysLive: 9 },
  { id: "al-4", imageSeed: "feat-2",     title: "The Loom House · 4-bed",  area: "Old Ikoyi",      price: "₦125M",    status: "live",        beds: 4, baths: 5, views: 318,  saves: 18, inquiries: 4,  daysLive: 5, featured: true },
  { id: "al-5", imageSeed: "admiralty",  title: "Admiralty Heights · 4-bed", area: "Lekki Phase 1", price: "₦95M",    status: "draft",       beds: 4, baths: 5, views: 0,    saves: 0,  inquiries: 0,  daysLive: 0 },
  { id: "al-6", imageSeed: "marula",     title: "Marula Court · 4-bed",    area: "Lekki Phase 1",  price: "₦74M",     status: "let",         beds: 4, baths: 3, views: 1812, saves: 102, inquiries: 24, daysLive: 38 },
];

export function getAgentListing(id?: string): AgentListing {
  return AGENT_LISTINGS.find((l) => l.id === id) ?? AGENT_LISTINGS[0];
}

// ─── Leads / inquiries / viewings / offers ─────────────────────
export type LeadKind = "inquiry" | "viewing" | "offer";
export type LeadStatus = "new" | "waiting" | "confirmed" | "countered" | "declined";

export type Lead = {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  buyer: { initials: string; name: string; tone: "primary" | "accent" | "neutral" };
  listing: { id: string; title: string };
  detail: string;
  when: string;
  amount?: string;
  threadId?: string;
};

export const LEADS: Lead[] = [
  { id: "ld-1", kind: "offer",   status: "new",       buyer: { initials: "AO", name: "Adebayo Okafor", tone: "primary" }, listing: { id: "al-1", title: "Hibiscus House" }, detail: "₦72.5M on ₦78M asking", when: "22h to respond", amount: "₦72.5M", threadId: "chinwe" },
  { id: "ld-2", kind: "viewing", status: "confirmed", buyer: { initials: "AO", name: "Adebayo Okafor", tone: "primary" }, listing: { id: "al-2", title: "Sandbridge Court" }, detail: "Today · 10:00 AM",     when: "in 2h",         threadId: "chinwe" },
  { id: "ld-3", kind: "viewing", status: "waiting",   buyer: { initials: "TM", name: "Tunde Maku",     tone: "accent"  }, listing: { id: "al-3", title: "Cedar Court 14" }, detail: "Tomorrow · 2:30 PM",   when: "needs reply",   threadId: "chinwe" },
  { id: "ld-4", kind: "inquiry", status: "new",       buyer: { initials: "BI", name: "Bilkisu Ibrahim", tone: "primary" }, listing: { id: "al-3", title: "Cedar Court 14" }, detail: "Asked about parking and service charges", when: "12m ago", threadId: "chinwe" },
  { id: "ld-5", kind: "inquiry", status: "waiting",   buyer: { initials: "FK", name: "Fola Komolafe",  tone: "neutral" }, listing: { id: "al-4", title: "The Loom House" }, detail: "Wants a virtual tour first", when: "1h ago",   threadId: "chinwe" },
  { id: "ld-6", kind: "offer",   status: "countered", buyer: { initials: "OD", name: "Ola Daramola",    tone: "accent"  }, listing: { id: "al-6", title: "Marula Court" },   detail: "You countered ₦74M with ₦76M", when: "Yesterday", amount: "₦74M" },
];

// ─── Analytics summary (used on a listing's agent view) ────────
export const LISTING_ANALYTICS = {
  views7d: 248,
  viewsTrend: "+18%",
  contactRate: "7.3%",
  contactTrend: "+1.2 pts",
  avgTimeOnPage: "2m 14s",
  saveRate: "6.9%",
};

// ─── Onboarding step 2 — verification ──────────────────────────
export const AGENT_VERIFY_DOCS = [
  { id: "nin",     title: "NIN slip",              detail: "11-digit national ID number"   },
  { id: "license", title: "NIESV licence",         detail: "Current practising certificate" },
  { id: "selfie",  title: "Headshot",              detail: "Clear, front-facing photo"      },
];

// ─── Create-listing wizard scaffolding ─────────────────────────
export const CREATE_LISTING_TYPES = [
  { id: "sale",     label: "For sale" },
  { id: "rent",     label: "To let"   },
  { id: "shortlet", label: "Shortlet" },
];

export const CREATE_LISTING_AMENITIES = [
  "Pool", "Gym", "Generator", "Security", "Parking", "Furnished",
  "Pet-friendly", "Garden", "Sea view", "Smart home", "Solar",
];
