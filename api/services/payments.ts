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

const paymentsService = {
  listBanks(): Promise<Bank[]> {
    return api.get("/payments/banks").then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.banks ?? d?.data ?? []);
    });
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
