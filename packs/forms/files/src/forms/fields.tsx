import { type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Form primitives: floating labels, announced errors, real semantics.
 *
 * Pure-CSS floating labels (the `placeholder-shown` trick), so no per-field
 * JS state. Every field is a native control: the platform picker on phones,
 * keyboard behaviour and screen-reader semantics for free.
 *
 * REQUIRED IS SEMANTICS, NOT AN ASTERISK. `required` sets the native
 * attribute and `aria-required`, which a screen reader announces before
 * submit. No asterisk is drawn: state the rule once with <RequiredNote />
 * instead of eight unexplained marks.
 */

function FieldShell({
  error,
  hint,
  errorId,
  hintId,
  children,
}: {
  error?: string;
  hint?: string;
  errorId: string;
  hintId: string;
  children: ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="min-h-5 pt-1.5">
        {error ? (
          /* ANNOUNCED, NOT MERELY SHOWN. The message answers a submit the
             reader already made; a screen reader that does not speak it
             leaves them on a form that refused them in silence. */
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const inputBase =
  'peer w-full rounded-lg border bg-background/40 px-4 pb-2.5 pt-6 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-300 placeholder-transparent focus:border-primary focus:shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]';

/* Four named properties, not `transition-all`: `all` makes the browser watch
   every animatable property on every field for the whole duration. */
const labelBase =
  'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground transition-[top,font-size,letter-spacing,color] duration-300 ' +
  'peer-focus:top-3.5 peer-focus:text-xs peer-focus:tracking-wide peer-focus:text-primary ' +
  'peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:tracking-wide';

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

type Common = {
  id: string;
  /** Defaults to `id`. Set it where autofill guesses wrong from the label. */
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
};

export function FloatingInput({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  maxLength,
  type = 'text',
  inputMode,
  autoComplete,
  autoCapitalize,
  spellCheck,
}: Common & {
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'url';
  autoComplete?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  spellCheck?: boolean;
}) {
  return (
    <FieldShell error={error} hint={hint} errorId={`${id}-error`} hintId={`${id}-hint`}>
      <div className="relative">
        <input
          id={id}
          name={name ?? id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder=" "
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(inputBase, error ? 'border-destructive/70' : 'border-border')}
        />
        <label htmlFor={id} className={labelBase}>
          {label}
        </label>
      </div>
    </FieldShell>
  );
}

export function FloatingTextarea({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  maxLength,
  rows = 4,
}: Common & { rows?: number }) {
  return (
    <FieldShell error={error} hint={hint} errorId={`${id}-error`} hintId={`${id}-hint`}>
      <div className="relative">
        <textarea
          id={id}
          name={name ?? id}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder=" "
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(inputBase, 'resize-none', error ? 'border-destructive/70' : 'border-border')}
        />
        <label
          htmlFor={id}
          className={cn(labelBase, 'top-7 peer-focus:top-3.5 peer-[:not(:placeholder-shown)]:top-3.5')}
        >
          {label}
        </label>
      </div>
    </FieldShell>
  );
}

/**
 * An option is a bare string when what is stored and what is read are the
 * same word, or a pair when they differ (`small-business` / `Small business`).
 */
export type SelectOption = string | { value: string; label: string };

/** A native select with its label permanently raised. */
export function FloatingSelect({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = 'Choose one',
  error,
  hint,
  required = false,
}: Omit<Common, 'maxLength'> & { options: SelectOption[]; placeholder?: string }) {
  return (
    <FieldShell error={error} hint={hint} errorId={`${id}-error`} hintId={`${id}-hint`}>
      <div className="relative">
        <select
          id={id}
          name={name ?? id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(
            inputBase,
            'appearance-none pr-10',
            !value && 'text-muted-foreground',
            error ? 'border-destructive/70' : 'border-border'
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => {
            const { value: v, label: l } =
              typeof option === 'string' ? { value: option, label: option } : option;
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
        <label htmlFor={id} className={cn(labelBase, 'top-3.5 translate-y-0 text-xs tracking-wide')}>
          {label}
        </label>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </FieldShell>
  );
}

/** A checkbox whose sentence says what agreeing means. */
export function Consent({
  id,
  checked,
  onChange,
  error,
  required = false,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 grid h-5 w-5 flex-none place-items-center rounded border transition-colors duration-200',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
            checked
              ? 'border-primary bg-primary text-primary-foreground'
              : error
                ? 'border-destructive/70'
                : 'border-border'
          )}
        >
          <Check className={cn('h-3.5 w-3.5 transition-opacity duration-200', checked ? 'opacity-100' : 'opacity-0')} />
        </span>
        <span className="text-sm leading-relaxed text-foreground">{children}</span>
      </label>
      <div className="min-h-5 pl-8 pt-1">
        {error && (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** States the required rule once, in words, at the foot of the form. */
export function RequiredNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Every field is required unless it says optional.
    </p>
  );
}

/**
 * A field only bots fill in. Off-screen (not `display:none`, which smarter
 * bots skip), out of the tab order, ignored by autofill and screen readers.
 * The API treats a filled honeypot as success and stores nothing, so a bot
 * learns nothing from the response.
 */
export function Honeypot({
  value,
  onChange,
  name = 'website',
}: {
  value: string;
  onChange: (value: string) => void;
  name?: string;
}) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label>
        Leave this empty
        <input
          type="text"
          name={name}
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}
