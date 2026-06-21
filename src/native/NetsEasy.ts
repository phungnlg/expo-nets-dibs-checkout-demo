import { NativeModules, Platform } from "react-native";

// TypeScript face of the Native SDK option (Option A). It mirrors the existing
// Flutter integration, which talks to the native Nets MiA / Nets Easy SDK over a
// custom MethodChannel (se.malsom/host.base). In React Native the equivalent is
// a native module: Swift (modules/nets-easy/ios) and Kotlin
// (modules/nets-easy/android) wrap Nets-Easy-iOS-SDK / Nets-Easy-Android-SDK and
// expose this single method.
//
// The native SDKs present their own payment UI (card form, 3DS, BankID
// app-switch) and resolve with a terminal status - the app never renders a
// WebView in this path.

export interface NetsEasyResult {
  status: "paid" | "failed" | "cancelled";
  paymentId: string;
}

interface NetsEasySpec {
  // Launches the native Nets Easy checkout for an existing paymentId and
  // resolves when the native SDK finishes (including any 3DS / BankID step).
  presentCheckout(paymentId: string): Promise<NetsEasyResult>;
}

const native = (NativeModules as Record<string, NetsEasySpec | undefined>)
  .NetsEasy;

// The native module is only present in a dev build / standalone app that bundled
// modules/nets-easy. In Expo Go it is absent, so the demo detects that and
// explains the path instead of crashing.
export const isNetsEasyAvailable = native != null;

export function presentNativeCheckout(paymentId: string): Promise<NetsEasyResult> {
  if (!native) {
    return Promise.reject(
      new Error(
        `NetsEasy native module not linked (running on ${Platform.OS} in Expo Go). ` +
          `Build a dev client with modules/nets-easy to exercise the native SDK path.`
      )
    );
  }
  return native.presentCheckout(paymentId);
}
