import api from "../client";
import type { ListingType } from "../types";
import type { ListListingsParams } from "./listings";

export interface SavedSearchFilters {
  location?: string | null;
  search?: string | null;
  type?: ListingType | null;
  propertyType?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minBeds?: number | null;
  minBaths?: number | null;
  sort?: "newest" | "price_asc" | "price_desc" | "top_rated";
}

export interface SavedSearch extends SavedSearchFilters {
  id: string;
  createdAt: string;
}

export const savedSearchQuery = (filters: SavedSearchFilters): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (
      [
        "location",
        "search",
        "type",
        "propertyType",
        "minPrice",
        "maxPrice",
        "minBeds",
        "minBaths",
        "sort",
      ].includes(key) &&
      value !== undefined &&
      value !== null &&
      value !== ""
    )
      params.set(key, String(value));
  }
  return params.toString();
};

export const pickSavedSearchFilters = (
  filters: SavedSearchFilters,
): SavedSearchFilters =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        [
          "location",
          "search",
          "type",
          "propertyType",
          "minPrice",
          "maxPrice",
          "minBeds",
          "minBaths",
          "sort",
        ].includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );

export function listingFiltersFromQuery(
  params: URLSearchParams,
): ListListingsParams {
  const number = (key: string) => {
    const text = params.get(key);
    if (!text || !/^\d+$/.test(text)) return undefined;
    const value = Number(text);
    return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  };
  const type = params.get("type");
  const sort = params.get("sort");
  return {
    search: (params.get("search") ?? params.get("q"))?.trim() || undefined,
    location: params.get("location")?.trim() || undefined,
    type:
      type === "SALE" || type === "RENT" || type === "SHORTLET"
        ? type
        : undefined,
    propertyType: params.get("propertyType") || undefined,
    minPrice: number("minPrice"),
    maxPrice: number("maxPrice"),
    minBeds: number("minBeds"),
    minBaths: number("minBaths"),
    sort:
      sort === "price_asc" || sort === "price_desc" || sort === "top_rated"
        ? sort
        : "newest",
  };
}

export function describeSavedSearch(filters: SavedSearchFilters): string {
  const money = (value: number) => `₦${value.toLocaleString("en-NG")}`;
  const budget =
    filters.minPrice != null && filters.maxPrice != null
      ? `${money(filters.minPrice)} – ${money(filters.maxPrice)}`
      : filters.maxPrice != null
        ? `Up to ${money(filters.maxPrice)}`
        : filters.minPrice != null
          ? `From ${money(filters.minPrice)}`
          : "Any budget";
  return [
    filters.type === "RENT"
      ? "For rent"
      : filters.type === "SALE"
        ? "For sale"
        : filters.type === "SHORTLET"
          ? "Shortlet"
          : "Rent or buy",
    budget,
    filters.minBeds ? `${filters.minBeds}+ bedrooms` : "Any bedrooms",
    filters.propertyType,
    filters.minBaths ? `${filters.minBaths}+ bathrooms` : null,
    filters.location && filters.search ? `“${filters.search}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const savedSearchesService = {
  list: () =>
    api.get<SavedSearch[]>("/saved-searches").then((response) => response.data),
  create: (filters: SavedSearchFilters) => {
    return api
      .post<SavedSearch>("/saved-searches", pickSavedSearchFilters(filters))
      .then((response) => response.data);
  },
  remove: (id: string) =>
    api
      .delete(`/saved-searches/${encodeURIComponent(id)}`)
      .then(() => undefined),
};
export default savedSearchesService;
