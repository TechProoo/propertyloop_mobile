import api from "../client";
import type { Listing, ListingType, Paginated } from "../types";

export interface ListListingsParams {
  page?: number;
  limit?: number;
  type?: ListingType;
  propertyType?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "top_rated";
}

const listingsService = {
  async list(params: ListListingsParams = {}): Promise<Paginated<Listing>> {
    const { data } = await api.get<Paginated<Listing>>("/listings", { params });
    return data;
  },

  async getById(id: string): Promise<Listing> {
    const { data } = await api.get<Listing>(`/listings/${id}`);
    return data;
  },

  async getBySlug(slug: string): Promise<Listing> {
    const { data } = await api.get<Listing>(`/listings/slug/${slug}`);
    return data;
  },
};

export default listingsService;
