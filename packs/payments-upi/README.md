# payments-upi: take UPI payments without a gateway

For Indian events, clubs, stalls and small shops that receive money on a
business UPI ID and reconcile against the bank statement.

## The flow

1. **Your route records the order and prices it on the server**, then calls
   `createPayment(env, { purpose: 'ticket', amountRupees: 300 })`
   (`api/_payments.ts`). It gets a reference like `PAY-7KQ2M9XH`.
2. **The pay page** fetches `GET /api/payments?ref=PAY-7KQ2M9XH` and renders:
   ```tsx
   <UpiQrPayment amount={data.amount} reference={data.reference} />
   <UtrForm reference={data.reference} />
   ```
   On a laptop: a QR to scan with a phone. On a phone: a "Pay with" chooser
   (Google Pay, PhonePe, Paytm, any UPI app) with the amount pre-filled.
3. **The payer submits the 12-digit UTR** their app shows. `POST
   /api/payments` claims it once (unique column): a pending payment becomes
   `submitted`; a UTR already used elsewhere is refused.
4. **You reconcile**: when the money appears in the account, mark it
   `verified` (SQL in the migration, or build an admin page with the `auth`
   pack).

## Rules this pack enforces, and why

- **The amount comes from the database, never the page or the URL.** The QR
  is drawn from `GET`'s stored amount.
- **A submitted UTR is a claim, not a payment.** Only the bank statement
  settles it. Do not issue tickets on `submitted` alone if fraud matters.
- **One UTR, one payment.** Enforced by a unique constraint, not by app code.
- **A pending payment accepts one UTR**, in one conditional `PATCH` (no race).
- **The QR is black on white** in every theme; banking scanners expect it.
- **`pa` is not percent-encoded** (some apps reject `%40`); no `tn` note
  (it makes the QR denser and harder to scan off a screen).
- **"No app opened" is explained**, starting with "do not pay again".

## Before launch

Test real handoffs on real Android and iOS devices with each listed app.
Behaviour differs by app version and OS, and a launched app proves nothing
about whether money moved.

If you need instant confirmation, refunds or cards, use a payment gateway
(Razorpay, Cashfree, Stripe India) instead; this pack is for the
no-gateway case.
