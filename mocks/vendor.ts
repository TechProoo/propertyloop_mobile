// Mocks for the Service Loop vendor role.

import type { Ionicons } from "@expo/vector-icons";

type IonName = keyof typeof Ionicons.glyphMap;

// ─── Vendor profile ─────────────────────────────────────────────
export const VENDOR = {
  id: "vendor-sparkle",
  initials: "SC",
  name: "Sparkle & Co.",
  tagline: "Spotless homes, every time",
  category: "Cleaning",
  area: "Lekki, Ikoyi, V.I.",
  radiusKm: 10,
  responseTime: "~14 min",
  bio:
    "A 4-person cleaning crew serving Lekki and Ikoyi since 2021. We bring our own eco-friendly supplies and never cut corners.",
  yearsExperience: 5,
  crewSize: 4,
  rating: 4.9,
  reviews: 287,
  completionRate: "98%",
  onTimeRate: "96%",
  verified: true,
  topRated: true,
  bank: "GTBank ••6789",
};

export const VENDOR_CATEGORIES = [
  { id: "cleaning",   label: "Cleaning",    icon: "sparkles-outline"        as IonName },
  { id: "plumbing",   label: "Plumbing",    icon: "water-outline"           as IonName },
  { id: "electrical", label: "Electrical",  icon: "flash-outline"           as IonName },
  { id: "generator",  label: "Generator",   icon: "battery-charging-outline" as IonName },
  { id: "painting",   label: "Painting",    icon: "color-palette-outline"   as IonName },
  { id: "carpentry",  label: "Carpentry",   icon: "construct-outline"       as IonName },
  { id: "pest",       label: "Pest control", icon: "bug-outline"            as IonName },
  { id: "ac",         label: "A/C repair",  icon: "snow-outline"            as IonName },
  { id: "moving",     label: "Moving",      icon: "cube-outline"            as IonName },
  { id: "gardening",  label: "Gardening",   icon: "leaf-outline"            as IonName },
];

export const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa", "Pidgin"];

export const VENDOR_DURATIONS = ["1-2 hrs", "2-3 hrs", "4-6 hrs", "Full day"];

// ─── Hero / dashboard ──────────────────────────────────────────
export const VENDOR_HERO = {
  greeting: "Good morning,",
  inEscrow: "₦94,500",
  inEscrowDetail: "Across 3 jobs · frees up as customers confirm",
  paidThisMonth: "₦312,000",
};

// ─── Booking requests ──────────────────────────────────────────
export type VendorRequest = {
  id: string;
  customer: { initials: string; name: string; tone: "primary" | "accent" | "neutral" };
  customerType: string;
  service: string;
  amountGross: string;
  amountNet: string;
  when: string;
  whenFull: string;
  duration: string;
  where: string;
  whereLine2?: string;
  note: string;
  ago: string;
  fresh?: boolean;
};

export const VENDOR_REQUESTS: VendorRequest[] = [
  {
    id: "vr-1",
    customer: { initials: "AO", name: "Adebayo Okafor", tone: "primary" },
    customerType: "Renter · 4 jobs booked before",
    service: "Standard home clean",
    amountGross: "₦18,000",
    amountNet: "₦16,200",
    when: "Tomorrow · 10:00 AM",
    whenFull: "Tomorrow · Sat 30 May · 10:00 AM",
    duration: "2-3 hrs",
    where: "Sandbridge Court, Flat 4B",
    whereLine2: "Admiralty Way, Lekki Phase 1",
    note: "3-bed flat, mostly tidy — just need the kitchen and both bathrooms done thoroughly. Building gate code is 4-2-1-8.",
    ago: "22m ago",
    fresh: true,
  },
  {
    id: "vr-2",
    customer: { initials: "LR", name: "Loop Realty (agent)", tone: "accent" },
    customerType: "Agent · 12 jobs booked before",
    service: "Post-construction clean",
    amountGross: "₦65,000",
    amountNet: "₦58,500",
    when: "Sat 30 May · all day",
    whenFull: "Sat 30 May · 8:00 AM - 5:00 PM",
    duration: "Full day",
    where: "Hibiscus House, Lekki P1",
    whereLine2: "Off Admiralty Way",
    note: "Newly built 4-bed detached. Dust, paint splatter on tiles, debris in courtyard. Need it shoot-ready.",
    ago: "1h ago",
  },
];

export function getVendorRequest(id?: string): VendorRequest {
  return VENDOR_REQUESTS.find((r) => r.id === id) ?? VENDOR_REQUESTS[0];
}

// ─── Earnings ──────────────────────────────────────────────────
export const VENDOR_EARNINGS = {
  lifetime: "₦4,128,500",
  inEscrow: "₦94,500",
  thisMonth: "₦312,000",
  releasingSoon: [
    { id: "re-1", customer: "Ngozi A.",    service: "Standard clean",      amount: "₦16,200", status: "Awaiting confirm" },
    { id: "re-2", customer: "Tunde B.",    service: "Deep clean",          amount: "₦31,500", status: "Confirmed · paying out" },
    { id: "re-3", customer: "Loop Realty", service: "Post-construction",   amount: "₦46,800", status: "Awaiting confirm" },
  ],
  pastPayouts: [
    { id: "po-1", date: "28 May 2026", jobs: "6 jobs", amount: "₦98,400" },
    { id: "po-2", date: "21 May 2026", jobs: "5 jobs", amount: "₦81,000" },
    { id: "po-3", date: "14 May 2026", jobs: "7 jobs", amount: "₦112,600" },
    { id: "po-4", date: "07 May 2026", jobs: "4 jobs", amount: "₦68,200" },
  ],
};

// ─── Disputes ──────────────────────────────────────────────────
// ─── Reviews ───────────────────────────────────────────────────
export type Review = {
  id: string;
  customer: { initials: string; name: string; tone: "primary" | "accent" | "neutral" };
  rating: number;
  when: string;
  body: string;
  reply?: string;
};

export const VENDOR_REVIEW_BREAKDOWN = [
  { stars: 5, pct: 88 },
  { stars: 4, pct: 9 },
  { stars: 3, pct: 2 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 0 },
];

export const VENDOR_REVIEWS: Review[] = [
  {
    id: "rv-1",
    customer: { initials: "NA", name: "Ngozi Adeyemi", tone: "primary" },
    rating: 5,
    when: "2 days ago",
    body: "Spotless work and so professional. The kitchen has never looked better — booked them again on the spot.",
    reply: "Thank you Ngozi! Always a pleasure — see you next month. 🙏",
  },
  {
    id: "rv-2",
    customer: { initials: "DO", name: "David Okoye", tone: "accent" },
    rating: 5,
    when: "1 week ago",
    body: "On time, brought all their own supplies. No complaints at all.",
  },
  {
    id: "rv-3",
    customer: { initials: "BT", name: "Bisi Taiwo", tone: "primary" },
    rating: 4,
    when: "2 weeks ago",
    body: "Good job overall, ran a little over time but the result was worth it.",
  },
];

// ─── Service menu ──────────────────────────────────────────────
export type VendorService = {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  archived?: boolean;
};

export const VENDOR_SERVICES: VendorService[] = [
  { id: "vs-1", name: "Standard home clean",     description: "Living areas, kitchen, bathrooms, mopping",     price: "₦18,000",      duration: "2-3 hrs" },
  { id: "vs-2", name: "Deep clean",              description: "Everything standard + inside appliances, skirting", price: "₦35,000",  duration: "4-6 hrs" },
  { id: "vs-3", name: "Post-construction clean", description: "Dust, paint splatter, debris removal",          price: "from ₦65,000", duration: "Full day" },
  { id: "vs-4", name: "One-off window clean",    description: "Exterior windows up to 2 floors",               price: "₦12,000",      duration: "1-2 hrs", archived: true },
];

// ─── Availability ──────────────────────────────────────────────
export const VENDOR_AVAILABILITY = {
  acceptingBookings: true,
  schedule: [
    { day: "Monday",    on: true,  hours: "8:00 AM – 6:00 PM" },
    { day: "Tuesday",   on: true,  hours: "8:00 AM – 6:00 PM" },
    { day: "Wednesday", on: true,  hours: "8:00 AM – 6:00 PM" },
    { day: "Thursday",  on: true,  hours: "8:00 AM – 6:00 PM" },
    { day: "Friday",    on: true,  hours: "8:00 AM – 6:00 PM" },
    { day: "Saturday",  on: true,  hours: "9:00 AM – 2:00 PM" },
    { day: "Sunday",    on: false, hours: "Off" },
  ],
  maxJobsPerDay: 3,
  responseCommitment: "Within 1 hr",
  blackoutDates: ["12–14 Jun"],
};

// ─── Public profile sample list ────────────────────────────────
export const VENDOR_WORK_GALLERY = ["clean-1", "clean-2", "clean-3", "clean-4"];
