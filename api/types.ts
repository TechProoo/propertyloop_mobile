// Mirrors backend Prisma + listing serializer. Keep in sync if backend changes.

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type ListingType = "SALE" | "RENT" | "SHORTLET";

export type ListingStatus =
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "PAUSED"
  | "SOLD"
  | "RENTED"
  | "ARCHIVED";

export interface AgentPublic {
  id: string;
  name: string;
  avatarUrl?: string | null;
  location?: string | null;
  phone?: string | null;
  email: string;
  bio?: string | null;
  agency: string | null;
  yearsExperience: number;
  specialty: string[];
  rating: number;
  listingsCount: number;
  soldRentedCount: number;
  verified: boolean;
  createdAt: string;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  type: ListingType;
  propertyType: string;
  priceNaira: number;
  priceLabel: string;
  period?: string | null;
  address: string;
  location: string;
  beds: number;
  baths: number;
  sqft: string;
  yearBuilt: string;
  description: string;
  features: string[];
  coverImage: string;
  images: string[];
  rating: number;
  verified: boolean;
  status: ListingStatus;
  viewsCount: number;
  createdAt: string;
  agent?: AgentPublic | null;
}
