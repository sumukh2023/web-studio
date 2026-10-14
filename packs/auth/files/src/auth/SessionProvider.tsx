import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { roleAtLeast, SessionContext, useSession, type Account, type Role, type SessionState } from './session-context';

/**
 * Holds who is signed in, from GET /api/auth/session. The cookie is HttpOnly,
 * so the browser cannot read it; asking the server is the only way to know.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ phase: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const data = (await response.json().catch(() => null)) as { account?: Account | null } | null;
      const account = data?.account ?? null;
      setState(account ? { phase: 'signed-in', account } : { phase: 'anonymous' });
      return account;
    } catch {
      setState({ phase: 'offline' });
      return null;
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = (await response.json().catch(() => ({}))) as { account?: Account; error?: string };
        if (response.ok && data.account) {
          setState({ phase: 'signed-in', account: data.account });
          return { ok: true as const };
        }
        return { ok: false as const, error: data.error ?? 'Sign-in failed. Please try again.' };
      } catch {
        return { ok: false as const, error: 'We could not reach the server. Check your connection.' };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      /* the local view of the session must not survive the attempt either way */
    }
    setState({ phase: 'anonymous' });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ state, refresh, signIn, signOut }), [state, refresh, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Render children only for someone signed in with at least `role`.
 *
 * A CONVENIENCE, NOT THE SECURITY BOUNDARY: every protected API route checks
 * the session itself, so a client that skipped this guard would get 401s and
 * see nothing.
 */
export function RequireRole({
  role = 'member',
  fallback,
  loading = null,
  forbidden,
  children,
}: {
  role?: Role;
  /** Shown when nobody is signed in, typically <LoginForm />. */
  fallback: ReactNode;
  loading?: ReactNode;
  /** Shown to someone signed in without enough rights. */
  forbidden?: ReactNode;
  children: ReactNode;
}) {
  const { state } = useSession();
  if (state.phase === 'loading') return <>{loading}</>;
  if (state.phase !== 'signed-in') return <>{fallback}</>;
  if (!roleAtLeast(state.account.role, role))
    return (
      <>
        {forbidden ?? (
          <p role="alert" className="text-sm text-muted-foreground">
            Your account does not have access to this page.
          </p>
        )}
      </>
    );
  return <>{children}</>;
}
