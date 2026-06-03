// Shared "saved listings" store. Backed by a module-level Set + React's
// useSyncExternalStore, so a heart tapped on the Home card, the listing
// detail, and the Saved tab all stay in lockstep without a Context wrapper.
//
// In-memory only for now (resets on reload). When auth lands, hydrate the
// Set from the bookmarks API on sign-in and POST/DELETE on toggle.
import { useSyncExternalStore } from "react";
import { tapLight } from "./haptics";

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

/** Toggle a listing's saved state. Fires a light haptic. Returns the new state. */
export function toggleSaved(id: string): boolean {
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  tapLight();
  emit();
  return saved.has(id);
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
