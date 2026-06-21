import { create } from "zustand";

export type PayMethod = "card" | "applepay" | "googlepay";
// The two integration options the client is evaluating for React Native.
export type Integration = "checkout-js" | "native-sdk";
export type PayStatus = "idle" | "created" | "pending" | "paid" | "failed";

interface PayState {
  amount: number;
  currency: string;
  method: PayMethod;
  integration: Integration;
  paymentId: string | null;
  status: PayStatus;
  trace: string[];
  setAmount: (n: number) => void;
  setMethod: (m: PayMethod) => void;
  setIntegration: (i: Integration) => void;
  setPayment: (id: string) => void;
  setStatus: (s: PayStatus) => void;
  log: (line: string) => void;
  reset: () => void;
}

export const usePay = create<PayState>((set) => ({
  amount: 2500,
  currency: "SEK",
  method: "card",
  integration: "checkout-js",
  paymentId: null,
  status: "idle",
  trace: [],
  setAmount: (n) => set({ amount: n }),
  setMethod: (m) => set({ method: m }),
  setIntegration: (i) => set({ integration: i }),
  setPayment: (id) => set({ paymentId: id, status: "created" }),
  setStatus: (s) => set({ status: s }),
  log: (line) => set((st) => ({ trace: [...st.trace, line] })),
  reset: () => set({ paymentId: null, status: "idle", trace: [] }),
}));
