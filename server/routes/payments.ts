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
      //
      // HostedPaymentPage: Nexi returns a hostedPaymentPageUrl on its own domain
      // (test.checkout.dibspayment.eu). The app loads THAT url in the WebView, so
      // the checkout runs first-party - this is what makes it render reliably in
      // WKWebView. EmbeddedCheckout (checkout.js inside our own http://localhost
      // page) renders in Safari but stalls on the SDK skeleton in WKWebView
      // because the payment iframe is third-party there (iOS ITP blocks its
      // cookie). returnUrl is our custom scheme; the WebView intercepts it.
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
            integrationType: "HostedPaymentPage",
            returnUrl: "nets3ds://payment/return",
            termsUrl: "https://example.com/terms",
            // Prefill the buyer so the hosted page skips the delivery-details
            // step and goes straight to card entry. In production the app would
            // pass the signed-in user here.
            merchantHandlesConsumerData: true,
            consumer: {
              email: "test.buyer@example.com",
              shippingAddress: {
                addressLine1: "Testgatan 1",
                postalCode: "11122",
                city: "Stockholm",
                country: "SWE",
              },
              phoneNumber: { prefix: "+46", number: "701234567" },
              privatePerson: { firstName: "Test", lastName: "Buyer" },
            },
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
      return res.json({
        paymentId: data.paymentId,
        hostedPaymentPageUrl: data.hostedPaymentPageUrl,
      });
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

paymentsRouter.get("/:id", async (req, res) => {
  const p = orders.get(req.params.id);
  if (!p) return res.status(404).json({ error: "not found" });

  // Live mode: never trust the client redirect. Verify server-side against
  // Nexi - after a 3DS approval the amount is reserved (authorized); once
  // captured it is charged. Either means the payment went through.
  if (NEXI_SECRET) {
    try {
      const { data } = await axios.get(`${NEXI_BASE}/v1/payments/${req.params.id}`, {
        headers: { Authorization: NEXI_SECRET },
      });
      const s = data?.payment?.summary ?? {};
      const ok = (s.reservedAmount ?? 0) > 0 || (s.chargedAmount ?? 0) > 0;
      const status = ok ? "paid" : p.status;
      return res.json({ paymentId: p.paymentId, status, summary: s });
    } catch (e) {
      return res.status(502).json({ error: "nexi status failed", detail: String(e) });
    }
  }

  res.json({ paymentId: p.paymentId, status: p.status });
});

paymentsRouter.post("/:id/result", (req, res) => {
  const p = orders.get(req.params.id);
  if (!p) return res.status(404).json({ error: "not found" });
  p.status = req.body?.status === "paid" ? "paid" : "failed";
  res.json({ paymentId: p.paymentId, status: p.status });
});
