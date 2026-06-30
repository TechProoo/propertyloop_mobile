import api from "../client";
import type { Listing } from "../types";

export interface PropertyBookmark {
  id: string;
  type: "PROPERTY";
  listingId: string;
  createdAt: string;
  listing?: Listing | null;
}

const bookmarksService = {
  /** Saved properties with their listing included. */
  listProperties(): Promise<PropertyBookmark[]> {
    return api
      .get<PropertyBookmark[]>("/bookmarks", { params: { type: "PROPERTY" } })
      .then((r) => r.data);
  },

  /** Toggle a property bookmark. Returns the new state. */
  toggleProperty(
    listingId: string,
  ): Promise<{ bookmarked: boolean; id: string }> {
    return api
      .post("/bookmarks/toggle", { entityId: listingId, type: "PROPERTY" })
      .then((r) => r.data);
  },

  /** Authoritative check of whether a single property is bookmarked. */
  checkProperty(listingId: string): Promise<{ bookmarked: boolean }> {
    return api
      .get("/bookmarks/check", {
        params: { entityId: listingId, type: "PROPERTY" },
      })
      .then((r) => r.data);
  },

  // ─── Vendors (saved service providers) ──────────────────────────────────
  // Vendor bookmarks use the backend "SERVICE" type, keyed by the vendor's
  // userId (see bookmarks.service buildUniqueWhere → vendorUserId).

  /** Toggle a vendor (service provider) bookmark. Returns the new state. */
  toggleVendor(vendorId: string): Promise<{ bookmarked: boolean; id: string }> {
    return api
      .post("/bookmarks/toggle", { entityId: vendorId, type: "SERVICE" })
      .then((r) => r.data);
  },

  /** Authoritative check of whether a single vendor is bookmarked. */
  checkVendor(vendorId: string): Promise<{ bookmarked: boolean }> {
    return api
      .get("/bookmarks/check", {
        params: { entityId: vendorId, type: "SERVICE" },
      })
      .then((r) => r.data);
  },

  /** IDs of all vendors the user has saved — one call to seed the directory. */
  listVendorIds(): Promise<string[]> {
    return api
      .get<{ vendorUserId?: string }[]>("/bookmarks", {
        params: { type: "SERVICE" },
      })
      .then((r) =>
        (r.data ?? [])
          .map((b) => b.vendorUserId)
          .filter((id): id is string => !!id),
      );
  },
};

export default bookmarksService;
