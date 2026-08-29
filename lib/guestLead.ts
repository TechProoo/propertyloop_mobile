// Name + email volunteered by someone browsing without an account, kept on the
// device so the signup form can prefill them if they come back to register.
//
// Two days, deliberately: long enough to cover a browse-now-register-later
// trip, short enough that a stale address can't quietly end up attached to
// someone else's account on a shared or handed-on phone. The same window
// gates re-prompting, so one record has one lifetime.
//
// Persisted via expo-secure-store (already a dependency — we avoid pulling in
// AsyncStorage just for one key), mirroring lib/recentlyViewed.
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "pl_guest_lead_v1";
const TTL_MS = 2 * 24 * 60 * 60 * 1000;

interface GuestLeadRecord {
  name?: string;
  email?: string;
  /** Epoch ms the modal was last shown — set even on dismissal, so it asks once. */
  promptedAt: number;
  /** Epoch ms details were actually captured. Absent when the prompt was dismissed. */
  savedAt?: number;
}

async function read(): Promise<GuestLeadRecord | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestLeadRecord;
    if (typeof parsed?.promptedAt !== "number") return null;
    // Past its window: clear it out so the next guest run starts fresh.
    if (Date.now() - parsed.promptedAt > TTL_MS) {
      await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
      return null;
    }
    return parsed;
  } catch {
    return null; // storage unavailable — behave as if nothing was stored
  }
}

/**
 * True when the guest prompt has already run inside the current window,
 * whether they filled it in or dismissed it. Callers use this to stay quiet.
 */
export async function hasPromptedGuest(): Promise<boolean> {
  return (await read()) !== null;
}

/** Record that the prompt was shown, so it doesn't reappear on the next screen. */
export async function markGuestPrompted(): Promise<void> {
  const existing = await read();
  await persist({ ...existing, promptedAt: Date.now() });
}

export async function saveGuestLead(name: string, email: string): Promise<void> {
  const now = Date.now();
  await persist({
    name: name.trim() || undefined,
    email: email.trim().toLowerCase() || undefined,
    promptedAt: now,
    savedAt: now,
  });
}

/**
 * Details to prefill the signup form with, or null when nothing was captured
 * or the two days have run out.
 */
export async function getGuestPrefill(): Promise<{
  name: string;
  email: string;
} | null> {
  const record = await read();
  if (!record?.savedAt || !record.email) return null;
  if (Date.now() - record.savedAt > TTL_MS) return null;
  return { name: record.name ?? "", email: record.email };
}

/** Drop the record once it has served its purpose (they registered). */
export async function clearGuestLead(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
}

async function persist(record: GuestLeadRecord): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable — the prompt simply asks again next time.
  }
}
