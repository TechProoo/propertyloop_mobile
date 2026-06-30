// Recently-viewed listings — a small external store (module state +
// useSyncExternalStore, mirroring lib/location) so the Home "Jump back in" rail
// updates the instant a buyer opens a listing, with no refetch or focus reload.
//
// Persisted device-locally via expo-secure-store (already a dependency — we
// avoid pulling in AsyncStorage just for one key). Capped to a handful of items
// with only the fields the rail card needs, so the payload stays well within
// SecureStore's per-key size budget.
import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";

export interface RecentListing {
  id: string;
  title: string;
  location: string;
  priceLabel: string;
  period?: string | null;
  coverImage: string;
  verified?: boolean;
}

const STORAGE_KEY = "pl_recently_viewed_v1";
const MAX = 8;

let items: RecentListing[] = [];
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

// Hydrate once from secure storage. Default (key absent or unreadable) is empty.
(async () => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed.filter((x) => x && typeof x.id === "string").slice(0, MAX);
        emit();
      }
    }
  } catch {
    /* storage unavailable — keep empty */
  }
})();

function persist() {
  SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
}

/** Record (or bump to front) a listing the buyer just opened. */
export function recordListingView(listing: RecentListing) {
  if (!listing?.id) return;
  const entry: RecentListing = {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    priceLabel: listing.priceLabel,
    period: listing.period,
    coverImage: listing.coverImage,
    verified: listing.verified,
  };
  items = [entry, ...items.filter((x) => x.id !== entry.id)].slice(0, MAX);
  emit();
  persist();
}

export function getRecentlyViewed(): RecentListing[] {
  return items;
}

/** Subscribe a component to the recently-viewed list (newest first). */
export function useRecentlyViewed(): RecentListing[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
}
