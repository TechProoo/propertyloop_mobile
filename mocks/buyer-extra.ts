// Mocks for the second wave of buyer screens — notifications, settings,
// payment, logbook, verify identity, help.

import type { Ionicons } from "@expo/vector-icons";

type IonName = keyof typeof Ionicons.glyphMap;

// ─── Notifications feed ─────────────────────────────────────────
export type NotifKind = "offer" | "viewing" | "vendor" | "doc" | "system";

export type Notif = {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  when: string;
  unread: boolean;
  href?: string;
};

export const NOTIFICATIONS: Notif[] = [
  {
    id: "n-1",
    kind: "offer",
    title: "Counter-offer on Hibiscus House",
    detail: "Emeka countered ₦72.5M with ₦75.5M",
    when: "12m ago",
    unread: true,
    href: "/offers",
  },
  {
    id: "n-2",
    kind: "viewing",
    title: "Viewing confirmed · Sandbridge Court",
    detail: "Tomorrow at 10:00 AM with Chinwe",
    when: "1h ago",
    unread: true,
    href: "/(tabs)/account",
  },
  {
    id: "n-4",
    kind: "vendor",
    title: "Bright Sparks Ltd marked the job complete",
    detail: "Confirm and release ₦42,000 from escrow",
    when: "Yesterday",
    unread: false,
    href: "/service-job/sj-1",
  },
  {
    id: "n-5",
    kind: "system",
    title: "3 new listings in your Lekki search",
    detail: "Saved search · Buy · Lekki",
    when: "2 days ago",
    unread: false,
    href: "/search-results",
  },
  {
    id: "n-6",
    kind: "offer",
    title: "Offer accepted on Cedar Court 14",
    detail: "Seller accepted ₦58M — closing started",
    when: "1 week ago",
    unread: false,
    href: "/purchase-progress",
  },
];

export const NOTIF_ICON: Record<NotifKind, { icon: IonName; tone: string }> = {
  offer:   { icon: "swap-horizontal-outline",  tone: "primary" },
  viewing: { icon: "calendar-outline",         tone: "primary" },
  vendor:  { icon: "construct-outline",        tone: "accent"  },
  doc:     { icon: "document-text-outline",    tone: "accent"  },
  system:  { icon: "sparkles-outline",         tone: "neutral" },
};

// ─── Settings ────────────────────────────────────────────────────
export const SETTINGS_PROFILE = {
  initials: "AO",
  name: "Adebayo Okafor",
  email: "adebayo.o@example.com",
  phone: "+234 805 123 4567",
  verified: true,
};

export type SettingsLink = {
  id: string;
  icon: IonName;
  title: string;
  detail?: string;
  href?: string;
  destructive?: boolean;
};

export type SettingsGroup = {
  label: string;
  links: SettingsLink[];
};

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    label: "Account",
    links: [
      { id: "edit",  icon: "person-outline",       title: "Edit profile",            href: "/edit-profile" },
      { id: "kyc",   icon: "shield-checkmark-outline", title: "Identity verification", detail: "Verified · NIN on file", href: "/verify-identity" },
      { id: "pay",   icon: "card-outline",         title: "Payment methods",         detail: "GTBank •• 4421",       href: "/payment" },
    ],
  },
  {
    label: "Preferences",
    links: [
      { id: "notif",  icon: "notifications-outline", title: "Notifications",  detail: "Push + email" },
      { id: "search", icon: "search-outline",        title: "Saved searches", detail: "3 active",     href: "/search-results" },
      { id: "lang",   icon: "globe-outline",         title: "Language",       detail: "English (NG)" },
    ],
  },
  {
    label: "Support",
    links: [
      { id: "help",   icon: "help-circle-outline",   title: "Help centre",     href: "/help" },
      { id: "logbook",icon: "document-text-outline", title: "About the logbook", href: "/logbook-info" },
      { id: "escrow", icon: "lock-closed-outline",   title: "How escrow works",  href: "/escrow-info" },
    ],
  },
  {
    label: "Legal",
    links: [
      { id: "terms",   icon: "reader-outline",  title: "Terms of service", href: "/terms"   },
      { id: "privacy", icon: "eye-outline",     title: "Privacy policy",   href: "/privacy" },
      { id: "out",     icon: "log-out-outline", title: "Sign out", destructive: true },
    ],
  },
];

// ─── Payment / fund escrow ──────────────────────────────────────
export type PaymentMethod = {
  id: string;
  label: string;
  detail: string;
  icon: IonName;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "gtb",  label: "GTBank •• 4421",       detail: "Default · debit",  icon: "card-outline" },
  { id: "psk",  label: "Paystack transfer",    detail: "Bank transfer · 2 min", icon: "swap-vertical-outline" },
  { id: "ussd", label: "USSD · *737#",          detail: "Pay from any GTB line", icon: "phone-portrait-outline" },
];

// ─── Logbook viewer ─────────────────────────────────────────────
export type LogbookEvent = {
  id: string;
  date: string;
  category: string;
  title: string;
  detail: string;
  cost?: string;
  vendor?: string;
  verified: boolean;
  receipt?: boolean;
};

export const LOGBOOK = {
  property: {
    name: "Hibiscus House",
    area: "Lekki Phase 1 · Lagos",
    since: "Logged since 2021",
    imageSeed: "hibiscus-1",
  },
  summary: {
    entries: 14,
    verified: 11,
    selfReported: 3,
    spend: "₦1.84M",
  },
  events: [
    { id: "l-1", date: "Mar 2026", category: "Plumbing",   title: "Master bath leak fixed",       detail: "Replaced cartridge + reseated trap", cost: "₦18,000",  vendor: "Tope Plumbing Co.",     verified: true,  receipt: true },
    { id: "l-2", date: "Feb 2026", category: "Cleaning",   title: "Deep clean · pre-shoot",       detail: "Full unit · 4 hrs",                  cost: "₦35,000",  vendor: "Sparkle & Co.",         verified: true,  receipt: true },
    { id: "l-3", date: "Dec 2025", category: "Electrical", title: "Generator service",            detail: "Oil + filter change · load test",    cost: "₦42,000",  vendor: "Bright Sparks Ltd",     verified: true,  receipt: true },
    { id: "l-4", date: "Nov 2025", category: "Owner log",  title: "Repainted living room",       detail: "Own painter · ivory matte",          cost: "₦55,000",                                  verified: false },
    { id: "l-5", date: "Sep 2025", category: "Inspection", title: "Annual structural inspection", detail: "No defects · report on file",                            vendor: "Hauz Surveyors",        verified: true,  receipt: true },
    { id: "l-6", date: "Jul 2025", category: "Pest",       title: "Termite treatment",            detail: "Perimeter spray · 6-mo warranty",    cost: "₦28,000",  vendor: "PestAway NG",           verified: true,  receipt: true },
  ] as LogbookEvent[],
};

// ─── KYC / identity verification ────────────────────────────────
export const KYC_STEPS = [
  { id: "nin",     title: "NIN",          detail: "11-digit national ID number" },
  { id: "selfie",  title: "Selfie",       detail: "Liveness check via camera" },
  { id: "address", title: "Proof of address", detail: "Utility bill, < 3 months" },
];

// ─── Help / support ─────────────────────────────────────────────
export type FaqItem = { q: string; a: string };

export const HELP_FAQ: FaqItem[] = [
  { q: "How does escrow work?",            a: "Your payment is held by PropertyLoop until you confirm the vendor's job is done. If anything goes wrong, raise a dispute before releasing." },
  { q: "Are agents verified?",             a: "Every agent submits NIESV licence + ID. We verify before they can list, and re-verify annually." },
  { q: "What happens after an offer is accepted?", a: "Both sides instruct solicitors. PropertyLoop coordinates title search, inspection, and document signing — see Purchase progress for the live status." },
  { q: "Can I cancel a viewing?",          a: "Yes — cancel from the viewing card up to 4 hours before. Late cancellations may incur a fee." },
  { q: "Is my data shared with agents?",   a: "Only what's needed to action the listing — your name, contact and offer. Bank details and KYC docs stay with us." },
];

export const HELP_CONTACT = {
  phoneLabel: "+234 705 305 3040",
  phoneTel:   "+2347053053040",
  hours:      "Mon–Sat · 9am–6pm WAT",
  email:      "help@propertyloop.ng",
};
