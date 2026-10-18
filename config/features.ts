/**
 * Features that can be turned off without tearing the code out.
 *
 * Nothing here is deleted — a flag flipped back to true restores the feature
 * exactly as it was, which is the point: a half-removed feature leaves dead
 * links and 404s behind, and putting it back later becomes archaeology.
 */

/**
 * Artisan Corner — the vendor marketplace: browsing artisans, booking a job,
 * service escrow, and the vendor dashboard.
 *
 * Switched off on 5 October 2026 at the company's request. Everything stays
 * in the codebase and the API keeps working; only the ways in are hidden, so
 * nobody can reach it from the app. Existing vendor accounts remain, and
 * their open jobs and payouts are settled off-platform.
 */
export const ARTISAN_CORNER = false;

/**
 * Product Marketplace — branded vendor storefronts selling furniture,
 * materials, décor and more, with an in-app cart and Paystack checkout.
 * Mirrors the website marketplace for buyers; vendors manage their store on
 * the web. Turned on 18 October 2026.
 */
export const PRODUCT_MARKETPLACE = true;
