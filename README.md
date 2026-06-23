# Nets/DIBS Checkout Demo (Expo / React Native)

A focused demo of **Step 5 - Payment (Nets/DIBS Checkout)** for a money-transfer
app migrating from Flutter to React Native. It implements the **two integration
options** the client is weighing, side by side, and proves the hard part end to
end: a **3DS2 challenge that triggers BankID**, app-switches, and **returns
cleanly into the app**.

![Demo](screenshots/demo.gif)

## The two options (selectable in the app)

| Option | How | This repo |
|---|---|---|
| **A - Native Nets SDK** | RN native module wrapping `Nets-Easy-iOS-SDK` / `Nets-Easy-Android-SDK`. The SDK renders its own UI and drives 3DS/BankID; no WebView. Mirrors the current Flutter `MethodChannel se.malsom/host.base`. | `src/native/NetsEasy.ts` + `modules/nets-easy/{ios,android}` bridge source; `app/native-sdk.tsx` invokes it. |
| **B - Checkout JS SDK** | Hosted Nexi Checkout page in `react-native-webview` (same as the website). The app intercepts the BankID app-switch and the return URL. | `app/checkout.tsx` + `server/routes/checkout.ts` (mounts the **real Checkout JS SDK** when keyed, sandbox otherwise). |

The client leans toward Option B ("we wonder if we even need the SDK ... switch
to Checkout JS"). This demo shows B working on a bare simulator and ships the A
bridge so both can be estimated against running code.

## What it shows

- **Step 5 payment screen** - amount, method picker (Card / Apple Pay / Google
  Pay), and the **integration-option toggle** (Checkout JS / Native SDK).
- **Checkout JS path** - WebView hosts the Nets/DIBS Checkout. With Nexi test
  keys set, the **real Nexi Checkout** loads in the WebView, live against
  `test.api.dibspayment.eu`; without keys a faithful sandbox stands in.
- **3DS2 -> BankID app-switch** - the page fires `bankid://`; the app intercepts
  it (`Linking.openURL`) and blocks the WebView from following the scheme.
- **Clean return** - the checkout redirects to `nets3ds://payment/return`; the
  app intercepts it, closes the WebView, and reconciles against the backend.
- **Native SDK path** - invokes the `NetsEasy.presentCheckout(paymentId)` bridge;
  in Expo Go (module unlinked) it explains the contract and simulates the result.
- **Observable trace** - the result screen prints every interception step.

## Screens

The first row is the **real Nexi Checkout** running live in the app WebView
against the Nexi test API (note the `(TEST)` amount and the `nets` branding).

| Step 5 - Payment | Real Nexi Checkout (live-test) | Real card + Pay (TEST) |
|---|---|---|
| ![Setup](screenshots/01-payment-setup.png) | ![Checkout](screenshots/02-checkout.png) | ![Pay](screenshots/03-checkout-pay.png) |

The second row is the interception mechanics, shown deterministically in the
sandbox (the BankID app-switch only fires for real on a device with a live
Swedish card, so it is simulated here).

| BankID intercept | Result + trace | Native SDK option |
|---|---|---|
| ![Intercept](screenshots/04-bankid-intercept.png) | ![Result](screenshots/05-result-paid.png) | ![Native](screenshots/06-native-sdk-option.png) |

## The interception (Checkout JS path)

`react-native-webview` exposes `onShouldStartLoadWithRequest`, a synchronous gate
before every navigation. Three cases, in `app/checkout.tsx`:

```ts
function onShouldStart(req) {
  if (isBankIdUrl(req.url)) { Linking.openURL(req.url); return false; } // app-switch
  if (isReturnUrl(req.url)) { router.replace("/result", ...); return false; } // return
  return true; // checkout page + 3DS ACS pages load normally
}
```

`isBankIdUrl` matches both `bankid://` and the `app.bankid.com` universal link.

## Architecture

```mermaid
flowchart TD
  A[Step 5 payment screen] -->|Checkout JS| B[WebView: Nets/DIBS Checkout]
  A -->|Native SDK| N[NetsEasy.presentCheckout]
  B -->|POST /payments| S[(Nexi backend: real test API or sandbox)]
  B --> C[Card / Apple Pay / Google Pay]
  C --> D[3DS2 challenge]
  D -->|bankid://| I{onShouldStartLoadWithRequest}
  I -->|isBankIdUrl| L[Linking.openURL -> BankID app]
  L --> B
  B -->|redirect nets3ds://payment/return| I
  I -->|isReturnUrl| R[Result + 3DS trace]
  N -->|native SDK handles 3DS/BankID| R
  R -->|GET /payments/:id| S
```

## Run

```sh
npm install
cp .env.example .env       # optional: add Nexi test keys for the REAL Checkout JS SDK
npm run server             # backend on :3000 (terminal 1)
npm start                  # Expo (terminal 2), open in Expo Go / simulator
```

Without keys the backend runs in **sandbox** mode and the flow is fully demoable.
With `NEXI_SECRET_KEY` + `NEXI_CHECKOUT_KEY` the backend creates a real payment
on `test.api.dibspayment.eu` and the WebView loads the real Nexi Checkout (the
screenshots above). Get test keys from the Nexi/Nets test portal (Company
settings -> API keys); the secret key stays server-side, the checkout key is
public.

### WebView finding: HostedPaymentPage vs EmbeddedCheckout

This is the answer to "how does Checkout JS behave inside a React Native
WebView", and it shaped the implementation:

- **EmbeddedCheckout** (the `checkout.js` SDK mounted in our own
  `http://localhost` page) renders fine in mobile Safari but **stalls on the SDK
  skeleton inside `WKWebView`**. The payment iframe is third-party there, so iOS
  ITP blocks the cookie it needs. `sharedCookiesEnabled` did not unblock it.
- **HostedPaymentPage** returns a `hostedPaymentPageUrl` on Nexi's **own domain**
  (`test.checkout.dibspayment.eu`). Loading that URL directly makes the checkout
  **first-party**, so it renders reliably in the WebView. The app intercepts the
  same `bankid://` app-switch and the `nets3ds://` return URL.

So the live path uses HostedPaymentPage (`server/routes/payments.ts`); the
EmbeddedCheckout page is kept in `server/routes/checkout.ts` for reference. For
Option B, **prefer the hosted page in the WebView, or an in-app browser tab
(`SFSafariViewController` / `expo-web-browser`)**, over an embedded iframe.

### Native SDK path (Option A) - dev build

`modules/nets-easy` is a real **Expo Modules API** local module (Swift + Kotlin),
autolinked by Expo. It is not available in Expo Go (which is why the app detects
its absence and simulates the path there). To run it for real, build a dev client:

```sh
npx expo run:ios        # or: npx expo run:android
```

The iOS module is verified to autolink and compile (`pod install` installs the
`NetsEasy` pod; the Swift target builds clean). To go live, add the Nets Easy SDK
dependency in `modules/nets-easy/ios/NetsEasy.podspec` /
`modules/nets-easy/android/build.gradle` and replace the stand-in checkout view
with the real SDK call - the JS contract (`presentCheckout`) stays the same.

## Production checklist

- Keep the Nexi secret key server-side only; the app uses the public checkout key.
- Verify the final payment server-side via the Nexi webhook / payment status -
  never trust the client redirect alone (the result screen re-checks the backend).
- Register the `nets3ds` return scheme with Nexi and add `bankid` to
  `LSApplicationQueriesSchemes` (iOS) and a browsable intent filter (Android).
- Test the same-device BankID return on real iOS and Android hardware.
- If WebView return proves unreliable, ship Option A behind the same screen
  contract - the bridge is already stubbed in `modules/nets-easy`.
