import api from "../client";

/* ─── Marketplace shapes (mirror the backend /marketplace/* payloads) ─────── */

export type StoreProduct = {
  id: string;
  name: string;
  priceNaira: number;
  compareAtNaira?: number;
  image: string;
  gallery?: string[];
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  tag?: "new" | "bestseller" | "sale";
  bulkEligible?: boolean;
  description?: string;
  specs?: { label: string; value: string }[];
  options?: { label: string; values: string[] }[];
};

export type ProductWithStore = StoreProduct & {
  storeSlug: string;
  storeName: string;
  storeAccent: string;
};

export type StoreTeaser = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  logo: string;
  banner: string;
  accent: string;
  rating: number;
  productsCount: number;
  verified: boolean;
  live: boolean;
};

export type StorePolicy = {
  icon: "shield" | "truck" | "clock" | "tag";
  label: string;
  detail: string;
};

export interface Storefront {
  ownerUserId?: string;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  logo: string;
  banner: string;
  accent: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  established: string;
  rating: number;
  reviews: number;
  ordersFulfilled: number;
  verified: boolean;
  responseTime: string;
  deliveryAreas: string[];
  policies: StorePolicy[];
  promo?: { title: string; subtitle: string; code: string };
  products: StoreProduct[];
}

export interface ProductDetail extends ProductWithStore {
  store: {
    ownerUserId?: string;
    slug: string;
    name: string;
    logo: string;
    accent: string;
    category: string;
    verified: boolean;
    ordersFulfilled: number;
    policies: StorePolicy[];
    promo?: { title: string; subtitle: string; code: string };
  };
  related: ProductWithStore[];
}

export interface ListProductsParams {
  search?: string;
  category?: string;
  storeSlug?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "top_rated" | "popular";
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateOrderPayload {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  address: string;
  city: string;
  state: string;
  notes?: string;
  returnUrl?: string;
  items: { productId: string; quantity: number; options?: Record<string, string> }[];
}

export interface InitOrderResult {
  orderNumber: string;
  reference: string;
  paymentUrl: string;
  total: number;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  reference: string;
  status:
    | "PENDING"
    | "PAID"
    | "FULFILLED"
    | "CANCELLED"
    | "DISPUTED"
    | "REFUNDED";
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  address: string;
  city: string;
  state: string;
  notes?: string;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  paidAt?: string;
  placedAt: string;
  items: {
    productId: string;
    storeId: string;
    storeName: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    options?: Record<string, string>;
    lineTotal: number;
  }[];
}

/* ─── Service ──────────────────────────────────────────────────────────── */

const marketplaceService = {
  async listStores(): Promise<StoreTeaser[]> {
    const { data } = await api.get<StoreTeaser[]>("/marketplace/stores");
    return data;
  },

  async getStore(slug: string): Promise<Storefront> {
    const { data } = await api.get<Storefront>(`/marketplace/stores/${slug}`);
    return data;
  },

  async listProducts(
    params: ListProductsParams = {},
  ): Promise<Paginated<ProductWithStore>> {
    const { data } = await api.get<Paginated<ProductWithStore>>(
      "/marketplace/products",
      { params },
    );
    return data;
  },

  async getProduct(id: string): Promise<ProductDetail> {
    const { data } = await api.get<ProductDetail>(
      `/marketplace/products/${id}`,
    );
    return data;
  },

  async createOrder(payload: CreateOrderPayload): Promise<InitOrderResult> {
    const { data } = await api.post<InitOrderResult>(
      "/marketplace/orders",
      payload,
    );
    return data;
  },

  async verifyOrder(reference: string): Promise<MarketplaceOrder> {
    const { data } = await api.get<MarketplaceOrder>(
      `/marketplace/orders/verify/${reference}`,
    );
    return data;
  },

  // Buyer opens a dispute on a paid order, keyed by order number.
  async raiseDispute(
    orderNumber: string,
    payload: { reason: string; details: string },
  ): Promise<{ id: string; status: string }> {
    const { data } = await api.post<{ id: string; status: string }>(
      `/marketplace/orders/${orderNumber}/dispute`,
      payload,
    );
    return data;
  },
};

export default marketplaceService;
