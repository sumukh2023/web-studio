import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { FloatingInput } from '@/forms/fields';
import { primaryButton } from '@/forms/styles';
import { isUtr, normaliseUtr } from './upi';

/**
 * After paying, the payer types the 12-digit UTR their UPI app shows.
 * POST /api/payments { reference, utr }. The server claims the UTR once
 * (a unique column), so the same transaction cannot settle two payments.
 */
export function UtrForm({ reference, onSubmitted }: { reference: string; onSubmitted?: () => void }) {
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isUtr(utr)) {
      setError('A UTR is the 12-digit number your UPI app shows after paying.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, utr: normaliseUtr(utr) }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'That did not go through. Please try again.');
      } else {
        setStatus('Thank you. We will confirm your payment once it reaches our account.');
        onSubmitted?.();
      }
    } catch {
      setError('We could not reach the server. Your UTR is still here; try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-2">
      <FloatingInput
        id="utr-reference"
        name="utr"
        label="UTR (12 digits)"
        inputMode="numeric"
        autoComplete="off"
        maxLength={16}
        value={utr}
        onChange={setUtr}
        error={error}
        hint="Found in your UPI app's payment details."
        required
      />
      <button type="submit" className={primaryButton} disabled={busy || Boolean(status)}>
        {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {busy ? 'Submitting' : 'I have paid'}
      </button>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {status}
      </p>
    </form>
  );
}
