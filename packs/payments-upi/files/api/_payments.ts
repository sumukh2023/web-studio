/**
 * Create a UPI payment for something your route has just recorded.
 *
 *   const payment = await createPayment(env, { purpose: 'ticket', amountRupees: 300, payerEmail });
 *   send(res, 200, { paymentUrl: `/pay/${payment.reference}` });
 *
 * THE SERVER DECIDES THE AMOUNT. Price on the server from your own data; never
 * accept an amount from the request body.
 */
import { rest, type SupabaseEnv } from './_supabase';

/** No 0/O, 1/I/L: a reference is read aloud and typed from a bank statement. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function paymentReference(prefix = 'PAY'): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}

export type Payment = {
  id: string;
  reference: string;
  purpose: string;
  amount_rupees: number;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'cancelled';
};

export async function createPayment(
  env: SupabaseEnv,
  input: { purpose: string; amountRupees: number; payerEmail?: string | null }
): Promise<Payment | null> {
  if (!Number.isInteger(input.amountRupees) || input.amountRupees <= 0) return null;
  // A unique-reference collision is astronomically rare; retry once anyway.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await rest<Payment[]>(env, 'payments', {
      method: 'POST',
      body: {
        reference: paymentReference(),
        purpose: input.purpose,
        amount_rupees: input.amountRupees,
        payer_email: input.payerEmail ?? null,
      },
      prefer: 'return=representation',
    });
    if (result.ok) return result.data[0] ?? null;
    if (result.status !== 409) break;
  }
  return null;
}
