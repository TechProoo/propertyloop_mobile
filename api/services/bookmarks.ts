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
};

export default bookmarksService;
