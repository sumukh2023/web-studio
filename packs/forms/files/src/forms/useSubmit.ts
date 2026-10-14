import { useCallback, useRef, useState } from 'react';

export type SubmitState<T> =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'success'; data: T }
  | { phase: 'error'; message: string; fieldErrors?: Record<string, string> };

/**
 * POST a JSON body to an api/ route, with the states a form actually has.
 *
 * - One request at a time: a double-click cannot submit twice.
 * - The route's own `error` sentence is shown, so copy lives in one place.
 * - `fieldErrors` from the route (a 400 with `{ fields: { email: '...' } }`)
 *   come back keyed by field, and focus moves to the first invalid control
 *   after React has painted the errors.
 * - 429 reads `Retry-After` and says how long, in minutes.
 * - A network failure says so, and says the form is still filled in.
 */
export function useSubmit<T = Record<string, unknown>>(endpoint: string) {
  const [state, setState] = useState<SubmitState<T>>({ phase: 'idle' });
  const busy = useRef(false);

  const submit = useCallback(
    async (body: Record<string, unknown>, form?: HTMLFormElement | null) => {
      if (busy.current) return;
      busy.current = true;
      setState({ phase: 'submitting' });
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        if (response.ok) {
          setState({ phase: 'success', data: json as T });
          return;
        }
        if (response.status === 429) {
          const seconds = Number(response.headers.get('retry-after') ?? 0);
          const minutes = Math.max(1, Math.round(seconds / 60));
          setState({
            phase: 'error',
            message: `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`,
          });
          return;
        }
        const fieldErrors =
          json.fields && typeof json.fields === 'object'
            ? (json.fields as Record<string, string>)
            : undefined;
        setState({
          phase: 'error',
          message:
            typeof json.error === 'string'
              ? json.error
              : 'Something went wrong. Please try again.',
          fieldErrors,
        });
        if (fieldErrors && form) {
          // After the errors render, so aria-invalid is there to be found.
          requestAnimationFrame(() =>
            form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
          );
        }
      } catch {
        setState({
          phase: 'error',
          message:
            'We could not reach the server. Check your connection; your answers are still here.',
        });
      } finally {
        busy.current = false;
      }
    },
    [endpoint]
  );

  const reset = useCallback(() => setState({ phase: 'idle' }), []);
  return { state, submit, reset };
}
