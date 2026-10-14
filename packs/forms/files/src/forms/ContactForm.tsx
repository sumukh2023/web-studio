import { useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { EASE } from '@/utils/motion';
import { FloatingInput, FloatingTextarea, Honeypot, RequiredNote } from './fields';
import { primaryButton, ghostButton } from './styles';
import { SuccessTick, TICK_SETTLED } from './SuccessTick';
import { useSubmit } from './useSubmit';

type Values = { name: string; email: string; message: string };
const EMPTY: Values = { name: '', email: '', message: '' };

/** Client-side copy of the route's rules, for instant feedback. The route is the authority. */
function validate(v: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!v.name.trim()) errors.name = 'Tell us your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    errors.email = 'Enter an email address we can reply to.';
  if (v.message.trim().length < 10) errors.message = 'A sentence or two, at least.';
  return errors;
}

/**
 * A complete contact form: validation, honeypot, submit states, announced
 * errors, and a success view. Posts to /api/contact. Restyle it; keep the
 * behaviour.
 */
export function ContactForm({ endpoint = '/api/contact' }: { endpoint?: string }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [trap, setTrap] = useState('');
  const [touched, setTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { state, submit, reset } = useSubmit<{ mailed?: boolean }>(endpoint);
  const reduced = useReducedMotion();

  const local = touched ? validate(values) : {};
  const server = state.phase === 'error' ? (state.fieldErrors ?? {}) : {};
  const errors = { ...server, ...local };
  const set = (key: keyof Values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    const found = validate(values);
    if (Object.keys(found).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }
    void submit({ ...values, website: trap }, formRef.current);
  };

  if (state.phase === 'success') {
    return (
      <div role="status" className="flex flex-col items-center py-10 text-center">
        <SuccessTick />
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduced ? 0 : TICK_SETTLED, ease: EASE.out }}
        >
          <h3 className="mt-6 font-heading text-2xl font-semibold text-foreground">
            Message sent
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {state.data.mailed
              ? 'A copy is on its way to your inbox. We will reply soon.'
              : 'We have it and will reply to the address you gave.'}
          </p>
          <button
            type="button"
            className={`${ghostButton} mt-8`}
            onClick={() => {
              setValues(EMPTY);
              setTouched(false);
              reset();
            }}
          >
            Send another
          </button>
        </motion.div>
      </div>
    );
  }

  const submitting = state.phase === 'submitting';
  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="relative grid gap-2">
      <Honeypot value={trap} onChange={setTrap} />
      <FloatingInput
        id="contact-name"
        name="name"
        label="Your name"
        autoComplete="name"
        value={values.name}
        onChange={set('name')}
        error={errors.name}
        maxLength={120}
        required
      />
      <FloatingInput
        id="contact-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        label="Email"
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        maxLength={254}
        required
      />
      <FloatingTextarea
        id="contact-message"
        name="message"
        label="Message"
        rows={5}
        value={values.message}
        onChange={set('message')}
        error={errors.message}
        maxLength={4000}
        required
      />
      <RequiredNote />
      <div className="mt-4 flex flex-col items-start gap-3">
        <button type="submit" className={primaryButton} disabled={submitting}>
          {submitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {submitting ? 'Sending' : 'Send message'}
        </button>
        {/* A stable live region: present before there is anything to say,
            so the first message is announced rather than missed. */}
        <p aria-live="polite" className="min-h-5 text-sm text-destructive">
          {state.phase === 'error' && !state.fieldErrors ? state.message : ''}
        </p>
      </div>
    </form>
  );
}
