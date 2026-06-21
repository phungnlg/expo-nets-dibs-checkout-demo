import { Router } from "express";
import { orders } from "./payments";

const CHECKOUT_KEY = process.env.NEXI_CHECKOUT_KEY;
const CHECKOUT_JS =
  process.env.NEXI_CHECKOUT_JS ?? "https://test.checkout.dibspayment.eu/v1/checkout.js?v=1";

// Page mounted inside the React Native WebView for the Checkout JS option.
// When a checkout key is present it mounts the REAL Nexi Checkout JS SDK; the
// SDK renders the card form, Apple Pay / Google Pay buttons, and drives the 3DS2
// + BankID step itself. Without a key it falls back to a faithful sandbox so the
// Step 5 flow is demoable with no merchant account.
export const checkoutRouter = Router();

checkoutRouter.get("/:id", (req, res) => {
  const p = orders.get(req.params.id);
  if (!p) return res.status(404).send("payment not found");
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(CHECKOUT_KEY ? realCheckout(p.paymentId) : sandboxCheckout(p));
});

// --- Real Nexi Checkout JS SDK -------------------------------------------
// developer.nexigroup.com/nexi-checkout/en-EU/api/checkout-js-sdk/
function realCheckout(paymentId: string): string {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>Nets/DIBS Checkout</title>
<style>body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#F1F4F9}</style>
</head><body>
<div id="checkout-container-div"></div>
<script src="${CHECKOUT_JS}"></script>
<script>
  var checkoutOptions = {
    checkoutKey: ${JSON.stringify(CHECKOUT_KEY)},
    paymentId: ${JSON.stringify(paymentId)},
    containerId: "checkout-container-div",
    language: "en-GB"
  };
  var checkout = new Dibs.Checkout(checkoutOptions);
  // The SDK handles card + Apple/Google Pay + 3DS2/BankID inside this page.
  // On completion we redirect to the app return URL; the RN WebView intercepts
  // both the bankid:// app-switch and this nets3ds:// return.
  checkout.on("payment-completed", function () {
    window.location.href = "nets3ds://payment/return?paymentId=${paymentId}&status=paid";
  });
  checkout.on("payment-failed", function () {
    window.location.href = "nets3ds://payment/return?paymentId=${paymentId}&status=failed";
  });
</script>
</body></html>`;
}

// --- Sandbox fallback (no merchant account) ------------------------------
function sandboxCheckout(p: { paymentId: string; amount: number; currency: string; method: string }): string {
  const amount = p.amount.toLocaleString("sv-SE");
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>Nets/DIBS Checkout (sandbox)</title>
<style>
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#F1F4F9;color:#121826}
  .bar{background:#0B1f2a;color:#fff;padding:14px 18px;font-weight:600;display:flex;gap:8px;align-items:center}
  .lock{font-size:13px;opacity:.7;font-weight:500}
  .wrap{padding:18px;max-width:520px;margin:0 auto}
  .card{background:#fff;border-radius:16px;padding:18px;box-shadow:0 1px 3px rgba(16,24,40,.08);margin-bottom:14px}
  .amt{font-size:30px;font-weight:700;letter-spacing:-.5px}
  .muted{color:#667085;font-size:13px}
  label{display:block;font-size:12px;color:#667085;margin:12px 0 6px}
  input{width:100%;padding:13px 14px;border:1px solid #D0D5DD;border-radius:10px;font-size:16px}
  .row{display:flex;gap:10px}.row>div{flex:1}
  button{width:100%;border:0;border-radius:12px;padding:15px;font-size:16px;font-weight:600;margin-top:12px}
  .pay{background:#235971;color:#fff}.bankid{background:#235971;color:#fff}.ghost{background:#fff;color:#344054;border:1px solid #D0D5DD}
  .apple{background:#000;color:#fff}.gpay{background:#fff;color:#3c4043;border:1px solid #D0D5DD}
  .hidden{display:none}.step{text-align:center}.badge{display:inline-block;background:#E6F0F4;color:#235971;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:600}
  .spin{width:34px;height:34px;border:3px solid #D0D5DD;border-top-color:#235971;border-radius:50%;margin:18px auto;animation:r 1s linear infinite}
  @keyframes r{to{transform:rotate(360deg)}}
  .tag{font-size:11px;color:#98A2B3;text-align:center;margin-top:8px}
</style></head><body>
<div class="bar">Nets / DIBS Checkout <span class="lock">&#128274; sandbox / 3DS2</span></div>
<div class="wrap">
  <div class="card"><div class="muted">Amount to pay</div><div class="amt">${amount} ${p.currency}</div></div>

  <div id="s1" class="card">
    <div class="badge">Payment method</div>
    <label>Card number</label>
    <input id="pan" inputmode="numeric" value="4268 2200 0000 0000" />
    <div class="row"><div><label>Expiry</label><input value="12/27"/></div><div><label>CVC</label><input value="123"/></div></div>
    <button class="pay" onclick="toChallenge()">Pay with card</button>
    <button class="apple" onclick="finish('paid')">&#63743; Pay</button>
    <button class="gpay" onclick="finish('paid')">G Pay</button>
    <div class="tag">Sandbox fallback - set NEXI_CHECKOUT_KEY to mount the real Checkout JS SDK</div>
  </div>

  <div id="s2" class="card hidden">
    <div class="badge">3-D Secure verification</div>
    <p class="muted step">Your bank requires BankID to approve this payment.</p>
    <button class="bankid" onclick="openBankId()">Open BankID app</button>
    <button class="ghost" onclick="finish('paid')">Simulate BankID approved</button>
    <button class="ghost" onclick="finish('failed')">Simulate cancelled</button>
  </div>

  <div id="s3" class="card hidden">
    <div class="badge">Waiting for BankID</div><div class="spin"></div>
    <p class="muted step">Complete signing in BankID, then return here.</p>
    <button class="ghost" onclick="finish('paid')">I have signed in BankID</button>
  </div>
</div>
<script>
  var pid=${JSON.stringify(p.paymentId)};
  function show(id){['s1','s2','s3'].forEach(function(s){document.getElementById(s).classList.add('hidden')});document.getElementById(id).classList.remove('hidden')}
  function toChallenge(){show('s2')}
  function openBankId(){show('s3');var t=Math.abs(Date.now()%1000000).toString(16);window.location.href='bankid:///?autostarttoken='+t+'&redirect=null'}
  function finish(st){fetch('/payments/'+pid+'/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:st})}).catch(function(){}).then(function(){window.location.href='nets3ds://payment/return?paymentId='+pid+'&status='+st})}
</script></body></html>`;
}
