import api from "../client";
import type { Listing, ListingType, Paginated } from "../types";

export interface CreateListingPayload {
  title: string;
  type: ListingType;
  propertyType: string;
  priceNaira: number;
  period?: string;
  address: string;
  location: string;
  beds: number;
  baths: number;
  sqft: string;
  yearBuilt?: string;
  description: string;
  features: string[];
  coverImage: string;
  images: string[];
}

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

  /** The signed-in agent's own listings (any status). */
  async listMine(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<Listing>> {
    const { data } = await api.get<Paginated<Listing>>("/listings/me/all", {
      params: params ?? {},
    });
    return data;
  },

  async getBySlug(slug: string): Promise<Listing> {
    const { data } = await api.get<Listing>(`/listings/slug/${slug}`);
    return data;
  },

  async getComps(id: string): Promise<CompsResponse> {
    const { data } = await api.get<CompsResponse>(`/listings/${id}/comps`);
    return data;
  },

  /** Upload one listing photo (multipart). Returns the stored URL. */
  async uploadPhoto(uri: string): Promise<string> {
    const form = new FormData();
    form.append("file", {
      uri,
      name: `photo-${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);
    const { data } = await api.post<{ fileUrl: string }>(
      "/listings/upload/photo",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.fileUrl;
  },

  async create(payload: CreateListingPayload): Promise<Listing> {
    const { data } = await api.post<Listing>("/listings", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<CreateListingPayload> & { status?: string },
  ): Promise<Listing> {
    const { data } = await api.patch<Listing>(`/listings/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<{ success: boolean }> {
    const { data } = await api.delete<{ success: boolean }>(`/listings/${id}`);
    return data;
  },
};

export interface Comp {
  id: string;
  title: string;
  coverImage: string;
  location: string;
  beds: number;
  baths: number;
  sqft: string;
  priceNaira: number;
  priceLabel: string;
  pricePerSqm: number | null;
  daysListed: number;
}

export interface CompsResponse {
  asking: { priceNaira: number; priceLabel: string };
  location: string;
  beds: number;
  type: string;
  medianNaira: number | null;
  medianLabel: string | null;
  askingVsMedianPct: number | null;
  avgDaysListed: number | null;
  count: number;
  comps: Comp[];
}

export default listingsService;
