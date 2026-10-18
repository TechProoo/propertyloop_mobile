/** Full naira, grouped — for prices and totals that must not be rounded. */
export function naira(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

/** Compact naira for tight spaces — "₦2.5M", "₦800k". */
export function nairaShort(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₦${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

/* ─── Marketplace fee rules (mirror backend marketplace.constants.ts) ─────
   These drive the pre-checkout estimate only; the backend recomputes the
   authoritative total at order creation. */
export const FREE_DELIVERY_THRESHOLD = 250_000;
export const FLAT_DELIVERY_FEE = 5_000;
export const BUYER_PLATFORM_FEE_PCT = 1.5;

export function estimateDelivery(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_DELIVERY_FEE;
}

export function estimatePlatformFee(subtotal: number): number {
  return Math.round(subtotal * (BUYER_PLATFORM_FEE_PCT / 100));
}
