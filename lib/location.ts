// Selected home-feed location. A small external store (module state +
// useSyncExternalStore, mirroring lib/favourites) so the Home header pill, the
// picker sheet, and the feed query all stay in lockstep without a Context.
//
// Persisted device-locally via expo-secure-store (already a dependency — we
// avoid pulling in AsyncStorage just for one key). The value survives the
// post-signup sign-out, so a location seeded during onboarding is still there
// when the buyer logs back in on the same device.
import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";

export interface LocationOption {
  /** Shown in the pill and the picker, e.g. "Lekki, Lagos". */
  label: string;
  /**
   * Token sent to the listings API. The backend matches `location` with a
   * case-insensitive `contains`, and real listings store "Area, City"
   * (e.g. "Lekki, Lagos"), so each token is a substring guaranteed to match.
   */
  filter: string;
}

// Curated areas. Keep `filter` as the bare area token so it matches every
// listing in that area regardless of how the city suffix is written.
export const LOCATIONS: LocationOption[] = [
  { label: "Lekki, Lagos", filter: "Lekki" },
  { label: "Ikoyi, Lagos", filter: "Ikoyi" },
  { label: "Victoria Island, Lagos", filter: "Victoria Island" },
  { label: "Yaba, Lagos", filter: "Yaba" },
  { label: "Ikeja, Lagos", filter: "Ikeja" },
  { label: "Surulere, Lagos", filter: "Surulere" },
  { label: "Magodo, Lagos", filter: "Magodo" },
  { label: "Maitama, Abuja", filter: "Maitama" },
  { label: "Asokoro, Abuja", filter: "Asokoro" },
  { label: "Port Harcourt", filter: "Port Harcourt" },
];

export const ALL_LOCATIONS_LABEL = "All locations";

const STORAGE_KEY = "pl_location_v1";
// Distinguishes an explicit "All locations" choice from "never chosen" (key
// absent) — the latter is still seedable from onboarding.
const ALL_SENTINEL = "__ALL__";

// Selected filter token; null = "All locations" (no `location` param sent).
let selected: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Hydrate once from secure storage. Default (key absent or unreadable) stays
// "All locations".
(async () => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw && raw !== ALL_SENTINEL) {
      selected = raw;
      emit();
    }
  } catch {
    /* storage unavailable — keep default */
  }
})();

export function getSelectedLocation(): string | null {
  return selected;
}

/** Set the active location (null = All) and persist it. */
export function setSelectedLocation(token: string | null) {
  selected = token;
  emit();
  SecureStore.setItemAsync(STORAGE_KEY, token ?? ALL_SENTINEL).catch(() => {});
}

/** Display label for a token (or the current selection). */
export function labelForLocation(token: string | null): string {
  if (!token) return ALL_LOCATIONS_LABEL;
  return LOCATIONS.find((l) => l.filter === token)?.label ?? token;
}

/** Map free onboarding text ("Lekki Phase 1, Ikoyi") to a known token. */
export function tokenForText(text: string): string | null {
  const t = text.toLowerCase();
  return (
    LOCATIONS.find((l) => t.includes(l.filter.toLowerCase()))?.filter ?? null
  );
}

/**
 * Seed the location from onboarding preferences, but only if the user has never
 * made a choice (key absent) — so we never override an explicit selection.
 * Device-local, so it's safe to call right before the post-signup sign-out.
 */
export async function seedLocationIfUnset(preferredText: string) {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) return; // already chosen (or explicitly "All")
    const token = tokenForText(preferredText);
    if (token) setSelectedLocation(token);
  } catch {
    /* non-fatal */
  }
}

/** Subscribe a component to the selected location token (null = All). */
export function useSelectedLocation(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => selected,
    () => selected,
  );
}
