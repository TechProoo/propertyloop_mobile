import api from "../client";

export interface Bank {
  name: string;
  code: string;
}

export interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

export interface JobEscrowInit {
  paymentUrl: string;
  reference: string;
}

export interface JobPaymentStatus {
  escrowStatus: string;
  jobId?: string;
}

const paymentsService = {
  listBanks(): Promise<Bank[]> {
    return api.get("/payments/banks").then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.banks ?? d?.data ?? []);
    });
  },

  /**
   * Start a Paystack checkout to fund a service job's escrow. Returns a hosted
   * `paymentUrl` to open in the browser; the escrow locks once Paystack fires
   * the `charge.success` webhook (see backend PaymentsService.handleChargeSuccess).
   */
  initJobEscrow(jobId: string): Promise<JobEscrowInit> {
    return api.post(`/payments/initialize/${jobId}`).then((r) => r.data);
  },

  /** Read the current escrow state for a job by its Paystack reference. */
  verifyJobPayment(reference: string): Promise<JobPaymentStatus> {
    return api.get(`/payments/verify/${reference}`).then((r) => r.data);
  },
  getBankAccount(): Promise<BankAccount | null> {
    return api
      .get("/payments/bank-account")
      .then((r) => r.data ?? null)
      .catch(() => null);
  },
  saveBankAccount(payload: BankAccount): Promise<any> {
    return api.post("/payments/bank-account", payload).then((r) => r.data);
  },
};

export default paymentsService;
