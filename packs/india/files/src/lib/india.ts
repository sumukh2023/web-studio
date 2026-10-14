/**
 * India-specific formats: mobile numbers, rupees, PAN, GSTIN, IFSC, PIN code,
 * UPI IDs. PURE (no DOM, no Node APIs) so ONE copy serves both the browser and
 * api/ (`import { indianMobile } from '../src/lib/india'`). Two copies of a
 * validation rule drift; a site can end up storing four spellings of
 * one phone number across five routes before it had one function.
 */

/* ------------------------------------------------------------------ */
/*  Mobile numbers                                                      */
/* ------------------------------------------------------------------ */

/**
 * A mobile number as it should be STORED: ten digits, nothing else.
 * `+91 98765 43210`, `+919876543210`, `98765-43210` and `9876543210` are one
 * number and must normalise to one string, or exact-match lookups (find my
 * booking) miss.
 *
 * Two edges a naive strip gets wrong:
 * - A leading `91` is dropped ONLY from a TWELVE-digit string. `9139271234` is
 *   a real mobile that begins 91; length is the only thing that tells a
 *   country code from the first two digits.
 * - A leading `0` is NEVER stripped. `09839271234` (trunk prefix) and
 *   `08041234567` (a landline with its STD code) are both eleven digits beginning 0;
 *   dropping the zero from the second gives `8041234567`, which passes every
 *   mobile test. Nothing separates them, so neither is accepted.
 */
export function normaliseIndianMobile(value: unknown): string {
  const digits = (typeof value === 'string' ? value : '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

/** Ten digits beginning 6-9. Apply to the NORMALISED form. */
export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

/** The normalised mobile, or null. Use this on the server before storing. */
export function indianMobile(value: unknown): string | null {
  const phone = normaliseIndianMobile(value);
  return INDIAN_MOBILE_PATTERN.test(phone) ? phone : null;
}

/** `9876543210` -> `+91 98765 43210`, for display only. */
export const displayMobile = (tenDigits: string) =>
  /^\d{10}$/.test(tenDigits) ? `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}` : tenDigits;

/* ------------------------------------------------------------------ */
/*  Money                                                               */
/* ------------------------------------------------------------------ */

/**
 * ₹1,00,000, not ₹100,000: Indian digit grouping, fixed locale so it never
 * changes with the reader's laptop settings. Store WHOLE RUPEES (or integer
 * paise) and convert at a payment gateway's boundary, never floats.
 */
export function formatRupees(amount: number, { paise = false } = {}): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: paise ? 2 : 0,
    maximumFractionDigits: paise ? 2 : 0,
  })}`;
}

/** ₹1.2 lakh, ₹3.5 crore: how amounts are spoken, for headlines and stats. */
export function formatRupeesWords(amount: number): string {
  const trim = (n: number) => n.toFixed(n < 10 ? 1 : 0).replace(/\.0$/, '');
  if (amount >= 1e7) return `₹${trim(amount / 1e7)} crore`;
  if (amount >= 1e5) return `₹${trim(amount / 1e5)} lakh`;
  return formatRupees(amount);
}

/* ------------------------------------------------------------------ */
/*  Identifiers                                                         */
/* ------------------------------------------------------------------ */

/** Upper-case and drop spaces/hyphens people type into ID fields. */
export const normaliseId = (raw: string) => raw.toUpperCase().replace(/[\s-]/g, '');

/** PAN: AAAAA9999A. Format check only; it does not prove the PAN exists. */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const isPan = (raw: string) => PAN_PATTERN.test(normaliseId(raw));

/** IFSC: 4 letters, a zero, 6 alphanumerics (bank + branch). */
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const isIfsc = (raw: string) => IFSC_PATTERN.test(normaliseId(raw));

/** PIN code: six digits, never starting with 0. */
export const isPinCode = (raw: string) => /^[1-9]\d{5}$/.test(raw.replace(/\s/g, ''));

/** UPI ID (VPA): handle@provider. Format only. */
export const isUpiId = (raw: string) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/.test(raw.trim());

const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * GSTIN: 2-digit state code, the PAN, an entity digit, `Z`, and a mod-36
 * check character. Validates the checksum, which catches most typos.
 */
export function isGstin(raw: string): boolean {
  const gstin = normaliseId(raw);
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const product = GST_CHARS.indexOf(gstin[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GST_CHARS[(36 - (sum % 36)) % 36] === gstin[14];
}
