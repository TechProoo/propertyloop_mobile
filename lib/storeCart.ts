// Marketplace cart — a small external store (module state +
// useSyncExternalStore, mirroring lib/recentlyViewed) so any screen reflects
// cart changes instantly, with device-local persistence via expo-secure-store.
//
// One line per product+options combination. Prices are snapshotted for display
// only; the backend recomputes every price and fee at checkout from the
// database, so a stale cart can never change what is charged.
import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";

export interface CartLine {
  productId: string;
  name: string;
  image: string;
  priceNaira: number;
  storeSlug: string;
  storeName: string;
  quantity: number;
  options?: Record<string, string>;
}

const STORAGE_KEY = "pl_store_cart_v1";
const MAX_QTY = 99;

let lines: CartLine[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
  void persist();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function snapshot() {
  return lines;
}

async function persist() {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Device storage full or unavailable — the cart still works in memory.
  }
}

// Hydrate once. Default (key absent or unreadable) is an empty cart.
(async () => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        lines = parsed;
        emit();
      }
    }
  } catch {
    // Ignore — start empty.
  }
})();

/** Same product + same selected options collapses onto one line. */
function sameLine(a: CartLine, b: { productId: string; options?: Record<string, string> }) {
  if (a.productId !== b.productId) return false;
  return JSON.stringify(a.options ?? {}) === JSON.stringify(b.options ?? {});
}

export const cart = {
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    const existing = lines.find((l) => sameLine(l, line));
    if (existing) {
      existing.quantity = Math.min(MAX_QTY, existing.quantity + quantity);
      lines = [...lines];
    } else {
      lines = [...lines, { ...line, quantity: Math.min(MAX_QTY, quantity) }];
    }
    emit();
  },

  setQuantity(
    productId: string,
    options: Record<string, string> | undefined,
    quantity: number,
  ) {
    if (quantity <= 0) {
      cart.remove(productId, options);
      return;
    }
    lines = lines.map((l) =>
      sameLine(l, { productId, options })
        ? { ...l, quantity: Math.min(MAX_QTY, quantity) }
        : l,
    );
    emit();
  },

  remove(productId: string, options?: Record<string, string>) {
    lines = lines.filter((l) => !sameLine(l, { productId, options }));
    emit();
  },

  clear() {
    lines = [];
    emit();
  },
};

/** Reactive view of the cart lines. */
export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Reactive total item count — for the tab/cart badge. */
export function useCartCount(): number {
  const l = useCart();
  return l.reduce((n, it) => n + it.quantity, 0);
}

/** Reactive subtotal in naira. */
export function useCartSubtotal(): number {
  const l = useCart();
  return l.reduce((n, it) => n + it.priceNaira * it.quantity, 0);
}
