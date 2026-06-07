// Shared "saved listings" store. Backed by a module-level Set + React's
// useSyncExternalStore, so a heart tapped on the Home card, the listing
// detail, and the Saved tab all stay in lockstep without a Context wrapper.
//
// Backed by the /bookmarks API: hydrated from the server on sign-in
// (syncSavedFromServer), and toggles are optimistic with a server round-trip
// that reverts on failure.
import { useSyncExternalStore } from "react";
import { tapLight } from "./haptics";
import bookmarksService from "@/api/services/bookmarks";

const saved = new Set<string>();
const listeners = new Set<() => void>();

// Cached, referentially-stable snapshot for list consumers — only rebuilt
// on a real change so useSyncExternalStore doesn't loop.
let idsSnapshot: string[] = [];

function rebuild() {
  idsSnapshot = Array.from(saved);
}

function emit() {
  rebuild();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Toggle a listing's saved state. Optimistic + server sync. Returns new state. */
export function toggleSaved(id: string): boolean {
  const willSave = !saved.has(id);
  if (willSave) saved.add(id);
  else saved.delete(id);
  tapLight();
  emit();
  // Persist; revert on failure.
  bookmarksService.toggleProperty(id).catch(() => {
    if (willSave) saved.delete(id);
    else saved.add(id);
    emit();
  });
  return willSave;
}

/** Replace the saved set (e.g. hydrated from the server). */
export function hydrateSaved(ids: string[]) {
  saved.clear();
  ids.forEach((id) => saved.add(id));
  emit();
}

/** Clear all saved state (on sign-out). */
export function clearSaved() {
  saved.clear();
  emit();
}

/** Pull the user's saved properties from the server into the store. */
export async function syncSavedFromServer() {
  try {
    const items = await bookmarksService.listProperties();
    hydrateSaved(items.map((b) => b.listingId));
  } catch {
    /* offline / unauthenticated — leave as-is */
  }
}

/** Subscribe a component to a single listing's saved state. */
export function useIsSaved(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => saved.has(id),
    () => saved.has(id),
  );
}

/** Subscribe to the full list of saved ids (Saved tab). */
export function useSavedIds(): string[] {
  return useSyncExternalStore(
    subscribe,
    () => idsSnapshot,
    () => idsSnapshot,
  );
}

/** Subscribe to just the count (e.g. a tab badge). */
export function useSavedCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => idsSnapshot.length,
    () => idsSnapshot.length,
  );
}
