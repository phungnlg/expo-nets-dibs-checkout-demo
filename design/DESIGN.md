# Design system - Nets/DIBS Checkout Demo

> Design-first artifact. Stitch MCP was not connected in the build session, so
> this spec is the source-of-truth design the app is built to match. Tokens are
> mirrored in `src/theme.ts` and shared with the sibling POC
> `expo-nexi-checkout-3ds` for a consistent money-app look.

## Brand

Dark fintech surface, single blue accent (`#2F6BFF`), BankID blue (`#235971`)
on the checkout page. Status greens/reds only on the result screen.

## Tokens

| Token | Value |
|---|---|
| bg | `#0E1116` |
| surface | `#181D26` |
| surfaceAlt | `#212733` |
| border | `#2C333F` |
| text | `#F4F6FA` |
| textMuted | `#9AA4B2` |
| primary | `#2F6BFF` |
| success | `#27C28A` |
| danger | `#FF5C5C` |
| warning | `#F5A623` |

Radius sm 8 / md 12 / lg 18 / pill 999. Spacing 4px base.

## Screens

1. **Step 5 - Payment (`index`)** - amount card, payment-method picker (Card /
   Apple Pay / Google Pay), and the integration-option picker (Checkout JS SDK /
   Native Nets SDK) that the client is evaluating. One "Pay now" CTA.
2. **Nets/DIBS Checkout (`checkout`)** - full-bleed WebView hosting the Checkout
   JS SDK page (real SDK when keyed, sandbox otherwise).
3. **Native Nets SDK (`native-sdk`)** - explains and invokes the native-module
   bridge (`NetsEasy.presentCheckout`), mirroring the Flutter MethodChannel.
4. **Result (`result`)** - status icon, payment id + integration + backend
   status, and the 3DS/BankID trace log.

## Checkout page (web, light theme)

White cards on `#F1F4F9`, dark top bar with lock + "sandbox / 3DS2" tag, BankID
button in BankID blue, Apple Pay button black, Google Pay button white-outline.
Three steps: method entry -> 3DS challenge -> waiting for BankID.
