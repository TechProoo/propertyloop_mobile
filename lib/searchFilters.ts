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
  type?: "SALE" | "RENT"; // listing type — absent = any
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

export function activeFilterCount(f: SearchFilters = current): number {
  return Object.keys(f).length;
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
