/**
 * UPI links: the `upi://pay` URI a QR encodes, and per-app deep links.
 *
 * The AMOUNT IS NEVER A FIGURE FROM THIS PAGE. It is the server's stored
 * amount for the payment reference (GET /api/payments?ref=), so editing the
 * URL or the DOM cannot change what is asked for.
 */

/** Payee UPI ID and display name, from VITE_ env (they are public by nature). */
export const UPI_PAYEE = {
  address: import.meta.env.VITE_UPI_PAYEE_ADDRESS ?? '',
  name: import.meta.env.VITE_UPI_PAYEE_NAME ?? '',
};

/**
 * `am` with two decimals (the form every UPI app parses alike); `tr` carries
 * the payment reference so the payer's app and your bank statement name the
 * record. No `tn` note: it repeated the reference and pushed the QR from 41
 * to 49 modules a side, measurably harder to scan off a screen.
 *
 * `pa` is written RAW: some UPI apps read `%40` literally and refuse the code.
 */
export function upiPaymentUri(amount: number, reference: string) {
  const params = [
    ['pn', UPI_PAYEE.name],
    ['am', amount.toFixed(2)],
    ['cu', 'INR'],
    ['tr', reference],
  ]
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `upi://pay?pa=${UPI_PAYEE.address}&${params}`;
}

export type UpiPlatform = 'android' | 'ios' | 'other';
export type UpiApp = 'google-pay' | 'phonepe' | 'paytm';

/** Routing only; neither the user agent nor the URL prices a payment. */
export function upiPlatform(userAgent: string, maxTouchPoints = 0): UpiPlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  // iPad Safari can ask for the desktop site with a Macintosh user agent.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  return 'other';
}

export const UPI_APPS: { id: UpiApp; name: string }[] = [
  { id: 'google-pay', name: 'Google Pay' },
  { id: 'phonepe', name: 'PhonePe' },
  { id: 'paytm', name: 'Paytm' },
];

const APP_TARGETS = {
  'google-pay': { package: 'com.google.android.apps.nbu.paisa.user', prefix: 'gpay://upi/pay' },
  phonepe: { package: 'com.phonepe.app', prefix: 'phonepe://pay' },
  paytm: { package: 'net.one97.paytm', prefix: 'paytmmp://pay' },
} as const;

/**
 * Same payee, amount and reference; only the app target changes. Android
 * intents pin the package so the OS does not pick a default. A launch is
 * NEVER proof of payment: test real handoffs on real phones.
 */
export function upiAppUri(uri: string, app: UpiApp, platform: UpiPlatform) {
  const query = uri.slice('upi://pay'.length);
  const target = APP_TARGETS[app];
  return platform === 'android'
    ? `intent://pay${query}#Intent;scheme=upi;package=${target.package};end`
    : `${target.prefix}${query}`;
}

/** A UTR (UPI transaction reference) is exactly twelve digits. */
export const normaliseUtr = (raw: string) => raw.replace(/\D/g, '');
export const isUtr = (raw: string) => /^\d{12}$/.test(normaliseUtr(raw));
