import api from "../client";

export type OfferStatus =
  | "PENDING"
  | "COUNTERED"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN"
  | "EXPIRED";

export type OfferActor = "BUYER" | "AGENT";
export type OfferFinancing = "CASH" | "OWN_FINANCING";
export type PurchaseStepState = "DONE" | "ACTIVE" | "TODO";
export type PurchaseStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface OfferListingRef {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  location: string;
  address: string;
  priceNaira: number;
  priceLabel: string;
  type: string;
}

export interface OfferParty {
  id: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface OfferEvent {
  id: string;
  type: string;
  actor: OfferActor;
  amountNaira: number | null;
  amountLabel: string | null;
  note?: string | null;
  createdAt: string;
}

export interface PurchaseStep {
  id: string;
  order: number;
  key: string;
  title: string;
  detail: string;
  state: PurchaseStepState;
  eta?: string | null;
  completedAt?: string | null;
}

export interface PropertyPurchase {
  id: string;
  offerId: string;
  listingId: string;
  buyerId: string;
  agentId: string;
  status: PurchaseStatus;
  agreedAmountNaira: number;
  agreedAmountLabel: string;
  createdAt: string;
  updatedAt: string;
  listing?: OfferListingRef;
  buyer?: OfferParty;
  agent?: OfferParty;
  steps?: PurchaseStep[];
}

export interface Offer {
  id: string;
  status: OfferStatus;
  listingId: string;
  buyerId: string;
  agentId: string;
  amountNaira: number;
  amountLabel: string;
  currentAmountNaira: number;
  currentAmountLabel: string;
  financing: OfferFinancing;
  note?: string | null;
  closeDate?: string | null;
  subjectToInspection: boolean;
  lastActor: OfferActor;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: OfferListingRef;
  buyer?: OfferParty;
  agent?: OfferParty;
  events?: OfferEvent[];
  purchase?: PropertyPurchase;
}

export interface CreateOfferPayload {
  listingId: string;
  amountNaira: number;
  financing?: OfferFinancing;
  note?: string;
  closeDate?: string;
  subjectToInspection?: boolean;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const offersService = {
  create(payload: CreateOfferPayload): Promise<Offer> {
    return api.post<Offer>("/offers", payload).then((r) => r.data);
  },
  listMine(status?: OfferStatus): Promise<Paginated<Offer>> {
    return api
      .get<Paginated<Offer>>("/offers/me", { params: status ? { status } : {} })
      .then((r) => r.data);
  },
  listReceived(status?: OfferStatus): Promise<Paginated<Offer>> {
    return api
      .get<Paginated<Offer>>("/offers/received", {
        params: status ? { status } : {},
      })
      .then((r) => r.data);
  },
  getById(id: string): Promise<Offer> {
    return api.get<Offer>(`/offers/${id}`).then((r) => r.data);
  },
  counter(id: string, amountNaira: number, note?: string): Promise<Offer> {
    return api
      .post<Offer>(`/offers/${id}/counter`, { amountNaira, note })
      .then((r) => r.data);
  },
  accept(id: string): Promise<Offer> {
    return api.post<Offer>(`/offers/${id}/accept`, {}).then((r) => r.data);
  },
  decline(id: string): Promise<Offer> {
    return api.post<Offer>(`/offers/${id}/decline`, {}).then((r) => r.data);
  },
  withdraw(id: string): Promise<Offer> {
    return api.post<Offer>(`/offers/${id}/withdraw`, {}).then((r) => r.data);
  },
  listPurchases(): Promise<PropertyPurchase[]> {
    return api.get<PropertyPurchase[]>("/offers/purchases").then((r) => r.data);
  },
  getPurchase(id: string): Promise<PropertyPurchase> {
    return api
      .get<PropertyPurchase>(`/offers/purchases/${id}`)
      .then((r) => r.data);
  },
};

export default offersService;
