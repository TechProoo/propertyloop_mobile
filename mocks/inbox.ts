// Inbox tab + conversation thread mocks.

import type { PLAvatar } from "@/components/brand/PLAvatar";

type AvatarTone = NonNullable<React.ComponentProps<typeof PLAvatar>["tone"]>;

// ─── Inbox list row ────────────────────────────────────────────
export type Conversation = {
  id: string;
  initials: string;
  name: string;
  tone: AvatarTone;
  verified: boolean;
  /** Property the thread is about (shown in subtitle). */
  about: string;
  lastMessage: string;
  /** "11:42", "Yesterday", "Mon" — design left this loose. */
  time: string;
  unread?: number;
  online?: boolean;
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: "chinwe",
    initials: "CN",
    name: "Chinwe Nwosu",
    tone: "accent",
    verified: true,
    about: "Sandbridge Court · 3-bed",
    lastMessage: "Perfect. I'll meet you at the lobby. The security will have your name.",
    time: "11:42",
    unread: 1,
    online: true,
  },
  {
    id: "emeka",
    initials: "EA",
    name: "Emeka Adeyemi",
    tone: "primary",
    verified: true,
    about: "Hibiscus House · for sale",
    lastMessage: "Seller's open to ₦75.5M as a counter. Worth a chat?",
    time: "Yesterday",
    unread: 2,
  },
  {
    id: "folake",
    initials: "FB",
    name: "Folake B.",
    tone: "primary",
    verified: true,
    about: "Marlin Studios shortlet",
    lastMessage: "Confirmed for Fri 12 Jun. Check-in code is 4218.",
    time: "Mon",
  },
  {
    id: "sparkle",
    initials: "SC",
    name: "Sparkle & Co.",
    tone: "primary",
    verified: true,
    about: "Standard clean · tomorrow",
    lastMessage: "Two cleaners arriving at 10am, gate code received. Thanks!",
    time: "Tue",
  },
];

// ─── Thread / conversation detail ──────────────────────────────
export type Bubble =
  | { side: "them" | "me"; kind: "text"; text: string; status?: "sending" | "delivered" }
  | {
      side: "them" | "me";
      kind: "attachment";
      filename: string;
      meta: string;
    };

export type Thread = {
  id: string;
  initials: string;
  name: string;
  tone: AvatarTone;
  verified: boolean;
  presence: string; // "Online · responds in ~20 min"
  pinned: {
    label: string;
    title: string;
    detail: string;
    imageSeed: string;
  };
  bubbles: Bubble[];
  lastReceipt: string; // "Delivered · 11:42"
  suggestedReplies: string[];
};

export const CHINWE_THREAD: Thread = {
  id: "chinwe",
  initials: "CN",
  name: "Chinwe Nwosu",
  tone: "accent",
  verified: true,
  presence: "Online · responds in ~20 min",
  pinned: {
    label: "Discussing",
    title: "Sandbridge Court · 3-bed",
    detail: "₦4.8M / yr · Lekki Phase 1",
    imageSeed: "feat-1",
  },
  bubbles: [
    { side: "them", kind: "text", text: "Hi Adebayo — saw your viewing request for Saturday 10am. Still works?" },
    { side: "me",   kind: "text", text: "Yes! Should I come straight to the building gate?" },
    { side: "them", kind: "text", text: "Perfect. I'll meet you at the lobby. The security will have your name." },
    { side: "them", kind: "attachment", filename: "tenancy_agreement.pdf", meta: "1.4 MB · Tap to preview" },
    { side: "me",   kind: "text", text: "Great, see you then." },
    { side: "me",   kind: "text", text: "Quick question — is the second parking spot covered?", status: "sending" },
  ],
  lastReceipt: "Delivered · 11:42",
  suggestedReplies: ["Is it negotiable?", "Can I move in next month?", "Any pets allowed?"],
};

export const getThread = (_id?: string): Thread => CHINWE_THREAD;
