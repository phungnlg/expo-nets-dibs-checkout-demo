import { api, API_BASE } from "@/api/client";
import type { PayMethod } from "@/state/payStore";

// Custom scheme the Nets/DIBS Checkout redirects to once payment + 3DS resolves.
export const RETURN_SCHEME = "nets3ds";
export const RETURN_PREFIX = `${RETURN_SCHEME}://payment/return`;

export interface CreatedPayment {
  paymentId: string;
  checkoutUrl: string; // hosted page that mounts the Nexi Checkout JS SDK
}

// Mirrors Nexi POST /v1/payments. The sandbox backend proxies this; in
// production the secret API key stays server-side and never touches the app.
export async function createPayment(input: {
  amount: number;
  currency: string;
  method: PayMethod;
}): Promise<CreatedPayment> {
  const { data } = await api.post("/payments", input);
  // Live mode returns Nexi's hosted page URL (its own domain, renders first-party
  // in the WebView). Sandbox returns no URL, so we load our local checkout page.
  const checkoutUrl =
    data.hostedPaymentPageUrl ?? `${API_BASE}/checkout/${data.paymentId}?method=${input.method}`;
  return { paymentId: data.paymentId, checkoutUrl };
}

export async function getStatus(paymentId: string): Promise<string> {
  const { data } = await api.get(`/payments/${paymentId}`);
  return data.status as string;
}

// --- WebView interceptor predicates (the Checkout JS option) ----------------
// 3DS2 triggers BankID, which app-switches via the bankid: scheme or the
// app.bankid.com universal link - neither is a page load the WebView can follow.
export function isBankIdUrl(url: string): boolean {
  return url.startsWith("bankid://") || url.includes("app.bankid.com");
}

export function isReturnUrl(url: string): boolean {
  return url.startsWith(RETURN_PREFIX);
}

export function parseReturnStatus(url: string): "paid" | "failed" {
  try {
    const params = new URLSearchParams(url.split("?")[1] ?? "");
    return params.get("status") === "paid" ? "paid" : "failed";
  } catch {
    return "failed";
  }
}
