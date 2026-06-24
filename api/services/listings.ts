import api from "../client";
import type {
  DocumentType,
  Listing,
  ListingDocument,
  ListingType,
  Paginated,
} from "../types";

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
  sqft?: string;
  yearBuilt?: string;
  description: string;
  features: string[];
  coverImage: string;
  images: string[];
  virtualTourUrl?: string;
  videoUrl?: string;
  videoUrls?: string[];
}

export interface AddDocumentPayload {
  name: string;
  type: DocumentType;
  url?: string;
  date?: string;
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

  /** Permanent maintenance history for a property (newest first). */
  async getLogbook(id: string): Promise<LogbookEntry[]> {
    const { data } = await api.get<LogbookEntry[]>(`/listings/${id}/logbook`);
    return data;
  },

  /** Upload one file (multipart) via the listings uploader. Returns the URL. */
  async uploadPhoto(
    uri: string,
    opts?: { name?: string; type?: string },
  ): Promise<string> {
    // Presigned direct-to-R2 upload — the same path the web app and vendor
    // image uploads use. The bytes go straight to storage instead of being
    // proxied through the API as multipart/form-data, which on mobile networks
    // dropped the connection mid-stream ("Network Error"). See vendors.uploadImage.
    const contentType = opts?.type ?? "image/jpeg";
    const filename = opts?.name ?? `photo-${Date.now()}.jpg`;

    // Read the local file (file:// or content://) into a blob.
    const blob = await (await fetch(uri)).blob();

    // 1) Ask the API for a short-lived presigned PUT URL.
    const { data } = await api.post<{ uploadUrl: string; fileUrl: string }>(
      "/listings/upload/photo/presign",
      { filename, contentType, size: blob.size, folder: "listings" },
    );

    // 2) Upload the bytes straight to storage.
    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
    if (!put.ok) throw new Error(`Storage upload failed (${put.status})`);

    return data.fileUrl;
  },

  /** Upload one video (presigned direct-to-R2). Returns the hosted URL. */
  async uploadVideo(
    uri: string,
    opts?: { name?: string; type?: string },
  ): Promise<string> {
    // Same presigned direct-to-R2 path as uploadPhoto, but the video bucket.
    // The video presign route requires a video/* content type.
    const contentType = opts?.type ?? "video/mp4";
    const filename = opts?.name ?? `video-${Date.now()}.mp4`;

    const blob = await (await fetch(uri)).blob();

    const { data } = await api.post<{ uploadUrl: string; fileUrl: string }>(
      "/listings/upload/video/presign",
      { filename, contentType, size: blob.size },
    );

    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
    if (!put.ok) throw new Error(`Storage upload failed (${put.status})`);

    return data.fileUrl;
  },

  /** Upload one listing document (presigned direct-to-R2). Returns the URL. */
  async uploadDocument(
    uri: string,
    opts?: { name?: string; type?: string },
  ): Promise<string> {
    const contentType = opts?.type || "application/octet-stream";
    const filename = opts?.name ?? `document-${Date.now()}`;

    const blob = await (await fetch(uri)).blob();

    const { data } = await api.post<{ uploadUrl: string; fileUrl: string }>(
      "/listings/upload/photo/presign",
      { filename, contentType, size: blob.size, folder: "listing-docs" },
    );

    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });
    if (!put.ok) throw new Error(`Storage upload failed (${put.status})`);

    return data.fileUrl;
  },

  /** Attach an uploaded document to a listing. */
  async addDocument(
    listingId: string,
    payload: AddDocumentPayload,
  ): Promise<ListingDocument> {
    const { data } = await api.post<ListingDocument>(
      `/listings/${listingId}/documents`,
      payload,
    );
    return data;
  },

  async removeDocument(
    listingId: string,
    docId: string,
  ): Promise<{ success: boolean }> {
    const { data } = await api.delete<{ success: boolean }>(
      `/listings/${listingId}/documents/${docId}`,
    );
    return data;
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

export interface LogbookEntry {
  id: string;
  listingId: string | null;
  jobId: string | null;
  category: string;
  title: string;
  description: string | null;
  vendorName: string;
  vendorId: string | null;
  cost: number; // naira
  completedAt: string;
  verified: boolean;
  createdAt: string;
}

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
