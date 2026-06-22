import type { NetsEasyResult } from "../../modules/nets-easy";

// Bridge to the native Nets Easy SDK module (Option A). The local Expo module at
// modules/nets-easy calls requireNativeModule at import time, which throws in
// Expo Go (no native module) - so it is loaded lazily behind try/catch. In a dev
// client / standalone build that bundled the module, it links and presents the
// native checkout.
let native: { presentCheckout(paymentId: string): Promise<NetsEasyResult> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  native = require("../../modules/nets-easy").default;
} catch {
  native = null;
}

export const isNetsEasyAvailable = native != null;

export function presentNativeCheckout(paymentId: string): Promise<NetsEasyResult> {
  if (!native) {
    return Promise.reject(
      new Error(
        "NetsEasy native module not linked (running in Expo Go). " +
          "Build a dev client (npx expo run:ios / run:android) with modules/nets-easy."
      )
    );
  }
  return native.presentCheckout(paymentId);
}

export type { NetsEasyResult };
