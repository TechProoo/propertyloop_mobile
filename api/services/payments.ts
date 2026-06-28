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
   * `paymentUrl` to open in an in-app browser. Pass `returnUrl` (a deep link)
   * so Paystack sends the user back into the app after paying. The app should
   * then call `verifyJobPayment` to confirm and lock escrow.
   */
  initJobEscrow(jobId: string, returnUrl?: string): Promise<JobEscrowInit> {
    return api
      .post(`/payments/initialize/${jobId}`, returnUrl ? { returnUrl } : {})
      .then((r) => r.data);
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
  /**
   * Ask Paystack who owns this account number at this bank. Returns the real
   * account holder name so the vendor can confirm before saving — guarding
   * against payouts to a mistyped / wrong account.
   */
  resolveAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<{ accountNumber: string; accountName: string }> {
    return api
      .get("/payments/resolve-account", {
        params: { account_number: accountNumber, bank_code: bankCode },
      })
      .then((r) => r.data);
  },
  saveBankAccount(payload: BankAccount): Promise<any> {
    return api.post("/payments/bank-account", payload).then((r) => r.data);
  },
};

export default paymentsService;
