import "./env";
import express from "express";
import { paymentsRouter } from "./routes/payments";
import { checkoutRouter } from "./routes/checkout";

// Sandbox backend standing in for the Nets/DIBS (Nexi) Checkout API.
//
// With NEXI_SECRET_KEY + NEXI_CHECKOUT_KEY set, /payments proxies the real Nexi
// test API (POST /v1/payments) and the checkout page mounts the real Checkout
// JS SDK. Without keys it serves an in-memory order book and a faithful sandbox
// checkout page, so the Step 5 flow runs end to end on a bare simulator.
const app = express();
app.use(express.json());

app.get("/health", (_req, res) =>
  res.json({ ok: true, mode: process.env.NEXI_SECRET_KEY ? "live-test" : "sandbox" })
);
app.use("/payments", paymentsRouter);
app.use("/checkout", checkoutRouter);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  const mode = process.env.NEXI_SECRET_KEY ? "live-test (real Nexi API)" : "sandbox (mock)";
  console.log(`[nets-dibs] listening on http://localhost:${PORT} - mode: ${mode}`);
});
