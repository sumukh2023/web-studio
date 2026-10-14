import { createContext, useContext } from 'react';

/** WIDEST LAST. Mirror ROLES in api/_auth.ts and the SQL CHECK. */
export const ROLES = ['member', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export type Account = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  must_change_password: boolean;
};

export type SessionState =
  | { phase: 'loading' }
  | { phase: 'anonymous' }
  | { phase: 'offline' }
  | { phase: 'signed-in'; account: Account };

export type SessionValue = {
  state: SessionState;
  refresh: () => Promise<Account | null>;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
};

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>.');
  return value;
}

export const roleAtLeast = (role: string, floor: Role) =>
  (ROLES as readonly string[]).indexOf(role) >= ROLES.indexOf(floor);
