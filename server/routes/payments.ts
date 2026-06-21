import { Router } from "express";
import axios from "axios";

export type Status = "created" | "pending" | "paid" | "failed";

interface Payment {
  paymentId: string;
  amount: number;
  currency: string;
  method: string;
  status: Status;
  createdAt: number;
}

export const orders = new Map<string, Payment>();

let seq = 4200;
const nextId = () => `pay_${(seq += 1).toString(36)}${(seq * 13).toString(36)}`;

const NEXI_SECRET = process.env.NEXI_SECRET_KEY;
const NEXI_BASE = process.env.NEXI_API_BASE ?? "https://test.api.dibspayment.eu";

export const paymentsRouter = Router();

// Create a payment. Real Nexi path when a secret key is configured, else mock.
paymentsRouter.post("/", async (req, res) => {
  const { amount, currency = "SEK", method = "card" } = req.body ?? {};
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  if (NEXI_SECRET) {
    try {
      // Nexi amounts are in minor units (ore for SEK).
      const { data } = await axios.post(
        `${NEXI_BASE}/v1/payments`,
        {
          order: {
            items: [
              {
                reference: "transfer",
                name: "Money transfer",
                quantity: 1,
                unit: "pcs",
                unitPrice: amount * 100,
                grossTotalAmount: amount * 100,
                netTotalAmount: amount * 100,
              },
            ],
            amount: amount * 100,
            currency,
          },
          checkout: {
            integrationType: "EmbeddedCheckout",
            url: `${process.env.PUBLIC_URL ?? "http://localhost:3000"}/checkout`,
            termsUrl: "https://example.com/terms",
          },
        },
        { headers: { Authorization: NEXI_SECRET } }
      );
      orders.set(data.paymentId, {
        paymentId: data.paymentId,
        amount,
        currency,
        method,
        status: "created",
        createdAt: Date.now(),
      });
      return res.json({ paymentId: data.paymentId });
    } catch (e) {
      return res.status(502).json({ error: "nexi create failed", detail: String(e) });
    }
  }

  const payment: Payment = {
    paymentId: nextId(),
    amount,
    currency,
    method,
    status: "created",
    createdAt: Date.now(),
  };
  orders.set(payment.paymentId, payment);
  res.json({ paymentId: payment.paymentId });
});

paymentsRouter.get("/:id", (req, res) => {
  const p = orders.get(req.params.id);
  if (!p) return res.status(404).json({ error: "not found" });
  res.json({ paymentId: p.paymentId, status: p.status });
});

paymentsRouter.post("/:id/result", (req, res) => {
  const p = orders.get(req.params.id);
  if (!p) return res.status(404).json({ error: "not found" });
  p.status = req.body?.status === "paid" ? "paid" : "failed";
  res.json({ paymentId: p.paymentId, status: p.status });
});
