import api from "../client";

export interface CreateRentalPayload {
  listingId: string;
  deposit: number;
  agencyFee: number;
  legalFee: number;
  leaseDuration: string;
  startDate: string; // ISO
  applicantName?: string;
  applicantPhone?: string;
  paymentMethod?: "CARD" | "TRANSFER" | "WALLET";
}

const rentalsService = {
  create(payload: CreateRentalPayload): Promise<any> {
    return api.post("/rental-applications", payload).then((r) => r.data);
  },
  listMine(): Promise<any> {
    return api.get("/rental-applications").then((r) => r.data);
  },
};

export default rentalsService;
