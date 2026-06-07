import api from "../client";

export interface VendorService {
  id: string;
  name: string;
  description: string;
  priceNaira: number;
  priceMode: string;
  priceLabel: string;
  duration?: string | null;
  active: boolean;
  archived: boolean;
  displayOrder: number;
}

export interface CreateServicePayload {
  name: string;
  description: string;
  priceNaira: number;
  priceMode?: "FIXED" | "FROM" | "HOURLY";
  duration?: string;
  displayOrder?: number;
}

function unwrap(data: any): VendorService[] {
  return Array.isArray(data) ? data : (data?.items ?? []);
}

const vendorServicesService = {
  list(): Promise<VendorService[]> {
    return api.get("/vendors/me/services").then((r) => unwrap(r.data));
  },
  create(payload: CreateServicePayload): Promise<VendorService> {
    return api.post("/vendors/me/services", payload).then((r) => r.data);
  },
  update(
    id: string,
    payload: Partial<CreateServicePayload> & { active?: boolean },
  ): Promise<VendorService> {
    return api.patch(`/vendors/me/services/${id}`, payload).then((r) => r.data);
  },
};

export default vendorServicesService;
