// Search filters — a tiny module-level store (useSyncExternalStore, mirroring
// lib/recentlyViewed) shared between the Filters modal and Search results.
//
// Filters used to travel as route params: the modal did
// `router.replace("/search-results", params)`. When search-results was already
// mounted beneath the modal, expo-router wouldn't refresh that instance's
// useLocalSearchParams, so applying a *second* filter showed stale results.
// A store makes the data flow direct: the modal writes, search-results
// subscribes and refetches the moment values change — no router involved.
// It also lets the modal reopen showing the currently-applied selections.
import { useSyncExternalStore } from "react";

export interface SearchFilters {
  type?: "SALE" | "RENT" | "SHORTLET"; // listing type — absent = any
  propertyType?: string; // e.g. "Duplex" — absent = any
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
}

let current: SearchFilters = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setSearchFilters(next: SearchFilters) {
  // Drop undefined keys so consumers can rely on key-presence checks.
  current = Object.fromEntries(
    Object.entries(next).filter(([, v]) => v !== undefined && v !== null),
  ) as SearchFilters;
  emit();
}

export function clearSearchFilters() {
  current = {};
  emit();
}

export function getSearchFilters(): SearchFilters {
  return current;
}

/**
 * How many filters a person would count on screen. A price range is one filter
 * even though it's two fields, so this matches the chips from describeFilters —
 * a badge reading "2" beside a single "₦1M – ₦5M" chip reads as a bug.
 */
export function activeFilterCount(f: SearchFilters = current): number {
  return describeFilters(f).length;
}

export function useSearchFilters(): SearchFilters {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}

/** Merge into the applied filters; a key set to undefined is removed. */
export function patchSearchFilters(patch: Partial<SearchFilters>) {
  setSearchFilters({ ...current, ...patch });
}

/** "₦2.5M", "₦800k" — compact enough for a chip. */
export function formatNaira(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

export type FilterChipKey =
  | "type"
  | "propertyType"
  | "price"
  | "minBeds"
  | "minBaths";

export interface ActiveFilter {
  key: FilterChipKey;
  label: string;
}

const TYPE_LABEL: Record<NonNullable<SearchFilters["type"]>, string> = {
  SALE: "For sale",
  RENT: "For rent",
  SHORTLET: "Shortlet",
};

/**
 * The applied filters as the labels a person reads on a chip. Shared by the
 * results screen and every filter badge, so the count and the chips can never
 * disagree about what's applied.
 */
export function describeFilters(f: SearchFilters = current): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (f.type) out.push({ key: "type", label: TYPE_LABEL[f.type] });
  if (f.propertyType) out.push({ key: "propertyType", label: f.propertyType });
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    let label: string;
    if (f.minPrice !== undefined && f.maxPrice !== undefined) {
      label = `${formatNaira(f.minPrice)} – ${formatNaira(f.maxPrice)}`;
    } else if (f.minPrice !== undefined) {
      label = `From ${formatNaira(f.minPrice)}`;
    } else {
      label = `Up to ${formatNaira(f.maxPrice!)}`;
    }
    out.push({ key: "price", label });
  }
  if (f.minBeds) {
    out.push({ key: "minBeds", label: `${f.minBeds}+ bed${f.minBeds === 1 ? "" : "s"}` });
  }
  if (f.minBaths) {
    out.push({ key: "minBaths", label: `${f.minBaths}+ bath${f.minBaths === 1 ? "" : "s"}` });
  }
  return out;
}

/** Drop one filter. A price chip clears both ends of the range. */
export function removeFilter(key: FilterChipKey) {
  const next: SearchFilters = { ...current };
  if (key === "price") {
    delete next.minPrice;
    delete next.maxPrice;
  } else {
    delete next[key];
  }
  setSearchFilters(next);
}
