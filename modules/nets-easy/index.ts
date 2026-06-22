import { requireNativeModule } from "expo-modules-core";

// Option A - the native Nets Easy SDK bridge, exposed as an Expo native module.
// Present in dev clients / standalone builds that include this local module;
// absent in Expo Go (where requireNativeModule throws).

export interface NetsEasyResult {
  status: "paid" | "failed" | "cancelled";
  paymentId: string;
}

interface NetsEasyNativeModule {
  // Launches the native Nets Easy checkout for an existing paymentId and
  // resolves when the native SDK finishes (including the 3DS / BankID step).
  presentCheckout(paymentId: string): Promise<NetsEasyResult>;
}

export default requireNativeModule<NetsEasyNativeModule>("NetsEasy");
