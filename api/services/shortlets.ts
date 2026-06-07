import api from "../client";

export interface CreateShortletPayload {
  listingId: string;
  guests: number;
  checkIn: string; // ISO
  checkOut: string; // ISO
  guestName?: string;
  guestPhone?: string;
  paymentMethod?: "CARD" | "TRANSFER" | "WALLET";
}

const shortletsService = {
  create(payload: CreateShortletPayload): Promise<any> {
    return api.post("/shortlet-bookings", payload).then((r) => r.data);
  },
  listMine(): Promise<any> {
    return api.get("/shortlet-bookings").then((r) => r.data);
  },
};

export default shortletsService;
