# Regenerating the screenshots and demo GIF

The `screenshots/` PNGs and `demo.gif` are captured from the running app on an
iOS simulator with Maestro.

## Prerequisites

- Xcode iOS simulator booted (captures used iPhone 17 Pro):
  `xcrun simctl boot "iPhone 17 Pro"`.
- Expo Go installed on the simulator.
- Maestro (https://maestro.mobile.dev) and ffmpeg.

## 1. Start backend and app

```sh
npm install
npm run server                 # terminal 1 - backend on :3000 (sandbox mode without keys)
npx expo start --port 8083     # terminal 2 - Metro
xcrun simctl openurl booted "exp://localhost:8083"   # load in Expo Go
```

Wait for Metro to bundle and the Step 5 - Payment screen to appear.

## 2. Capture the Checkout JS walkthrough (screens 01-05 + GIF source)

```sh
maestro test maestro/capture.yaml
```

It selects the Checkout JS option, walks payment -> 3DS2 -> BankID intercept ->
result, and self-resets to home if a previous run left the app mid-flow. The
BankID step taps `Open BankID app`, firing `bankid://`; on a bare simulator there
is no BankID app, so the app shows an alert confirming the intercept and the flow
continues via the sandbox "I have signed" path. On real hardware the same tap
opens the BankID app.

## 3. Capture the Native SDK option screen (06)

```sh
maestro test maestro/native.yaml
```

## 4. Record the demo GIF

```sh
xcrun simctl io booted recordVideo --codec h264 -f /tmp/demo.mov &
maestro test maestro/capture.yaml
pkill -INT -f "simctl io booted recordVideo"

ffmpeg -y -i /tmp/demo.mov -vf "fps=10,scale=300:-1:flags=lanczos,palettegen=stats_mode=diff" /tmp/pal.png
ffmpeg -y -i /tmp/demo.mov -i /tmp/pal.png \
  -lavfi "fps=10,scale=300:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" \
  screenshots/demo.gif
```

## Real Nexi Checkout JS SDK

Set `NEXI_SECRET_KEY` + `NEXI_CHECKOUT_KEY` in `.env` (see `.env.example`). The
backend then proxies the real Nexi test API and `server/routes/checkout.ts` mounts
the real `checkout.js` SDK instead of the sandbox page.
