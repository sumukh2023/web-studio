import { useEffect, useId, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowUpRight, Check, Copy, Smartphone, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks';
import { formatRupees } from '@/lib/india';
import { UPI_APPS, UPI_PAYEE, upiAppUri, upiPaymentUri, upiPlatform } from './upi';

/**
 * The QR, the amount and the payee on one card.
 *
 * - The QR is BLACK ON WHITE whatever the theme: banking-app scanners are
 *   tuned for dark modules on a light ground.
 * - TOUCH, NOT WIDTH, decides the app chooser: `(pointer: coarse)` is true on
 *   phones/tablets and false on a laptop at any window size, where `upi://`
 *   opens nothing, so the QR stays a plain image to scan.
 * - A TAP THAT OPENS NOTHING IS EXPLAINED: if the page still has focus two
 *   seconds after choosing an app, a note says what probably happened and,
 *   first of all, not to pay twice.
 * - Back from the UPI app, focus moves to the UTR field (#utr-reference).
 */
export function UpiQrPayment({ amount, reference }: { amount: number; reference: string }) {
  const uri = upiPaymentUri(amount, reference);
  const touch = useMediaQuery('(pointer: coarse)');
  const platform =
    typeof navigator === 'undefined' ? 'other' : upiPlatform(navigator.userAgent, navigator.maxTouchPoints);
  const [qr, setQr] = useState<string | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appMissing, setAppMissing] = useState(false);
  const chooserId = useId();
  const firstApp = useRef<HTMLAnchorElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const leftForApp = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 480,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((data) => !cancelled && setQr(data))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [uri]);

  useEffect(() => {
    if (chooserOpen) firstApp.current?.focus({ preventScroll: true });
  }, [chooserOpen]);

  useEffect(() => {
    const away = () => {
      if (document.visibilityState === 'hidden') leftForApp.current = true;
    };
    const blur = () => {
      leftForApp.current = true;
    };
    const back = () => {
      if (document.visibilityState !== 'visible' || !leftForApp.current) return;
      window.setTimeout(() => document.getElementById('utr-reference')?.focus(), 600);
    };
    document.addEventListener('visibilitychange', away);
    document.addEventListener('visibilitychange', back);
    window.addEventListener('blur', blur);
    return () => {
      document.removeEventListener('visibilitychange', away);
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('blur', blur);
      window.clearTimeout(timer.current);
    };
  }, []);

  const openedApp = () => {
    leftForApp.current = false;
    setAppMissing(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!leftForApp.current && document.visibilityState === 'visible' && document.hasFocus())
        setAppMissing(true);
    }, 2000);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(UPI_PAYEE.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* The address is printed in full beside the button; nothing is lost. */
    }
  };

  const appLink =
    'inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <section aria-labelledby="upi-heading" className="rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id="upi-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Scan to pay
          </p>
          <p className="mt-1 font-heading text-xl font-semibold">{UPI_PAYEE.name}</p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold tracking-wider text-muted-foreground">
          UPI
        </span>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="rounded-xl bg-white p-2">
          {qr ? (
            <img
              src={qr}
              alt={`UPI QR code to pay ${formatRupees(amount)} to ${UPI_PAYEE.name}`}
              width={240}
              height={240}
              className="block size-48 rounded-lg"
            />
          ) : (
            <div role="status" className="grid size-48 place-items-center text-xs text-neutral-500">
              Preparing QR code
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Amount</p>
        <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{formatRupees(amount)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Reference {reference}</p>
      </div>

      {touch && (
        <button
          ref={trigger}
          type="button"
          onClick={() => {
            setAppMissing(false);
            setChooserOpen(true);
          }}
          aria-expanded={chooserOpen}
          aria-controls={chooserId}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Smartphone aria-hidden="true" className="size-4" /> Pay {formatRupees(amount)} with a UPI app
        </button>
      )}

      {touch && chooserOpen && (
        <div
          id={chooserId}
          role="group"
          aria-label="UPI apps"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setChooserOpen(false);
              trigger.current?.focus();
            }
          }}
          className="mt-4 grid gap-2 border-t border-border pt-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Pay with</p>
            <button
              type="button"
              onClick={() => {
                setChooserOpen(false);
                trigger.current?.focus();
              }}
              aria-label="Close UPI app choices"
              className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          {UPI_APPS.map((app, index) => (
            <a key={app.id} ref={index === 0 ? firstApp : undefined} href={upiAppUri(uri, app.id, platform)} onClick={openedApp} className={appLink}>
              {app.name}
              <ArrowUpRight aria-hidden="true" className="size-4 opacity-60" />
            </a>
          ))}
          <a href={uri} onClick={openedApp} className={appLink}>
            Other UPI app
            <ArrowUpRight aria-hidden="true" className="size-4 opacity-60" />
          </a>
        </div>
      )}

      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-muted-foreground">
        {appMissing &&
          'No UPI app opened. If you have not paid, scan the QR from another phone or pay to the UPI ID below. If you already paid, do not pay again: enter the UTR.'}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">UPI ID</span>
        <span className="font-medium">{UPI_PAYEE.address}</span>
        <button
          type="button"
          onClick={copyAddress}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </section>
  );
}
