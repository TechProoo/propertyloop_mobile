import api from "../client";

export interface SubmitKycPayload {
  fullName?: string;
  documentType: string;
  documentNumber?: string;
  documentUrls: string[];
  selfieUrl?: string;
}

const kycService = {
  submit(payload: SubmitKycPayload): Promise<any> {
    return api.post("/kyc", payload).then((r) => r.data);
  },
  getMine(): Promise<any> {
    return api.get("/kyc/me").then((r) => r.data);
  },
};

export default kycService;
