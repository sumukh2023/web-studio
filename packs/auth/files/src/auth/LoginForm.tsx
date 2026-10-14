import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { FloatingInput } from '@/forms/fields';
import { primaryButton } from '@/forms/styles';
import { useSession } from './session-context';

/** Email + password sign-in against /api/auth/login. Restyle freely. */
export function LoginForm({ title = 'Sign in' }: { title?: string }) {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const result = await signIn(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setPassword('');
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto grid w-full max-w-sm gap-2">
      <h1 className="mb-4 font-heading text-2xl font-semibold text-foreground">{title}</h1>
      <FloatingInput
        id="login-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        label="Email"
        value={email}
        onChange={setEmail}
        required
      />
      <FloatingInput
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        label="Password"
        value={password}
        onChange={setPassword}
        required
      />
      <button type="submit" className={`${primaryButton} mt-2`} disabled={busy}>
        {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {busy ? 'Signing in' : 'Sign in'}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm text-destructive">
        {error}
      </p>
    </form>
  );
}
