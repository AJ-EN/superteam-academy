'use client';

import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';
import type { AuthContextValue } from '@/providers/AuthProvider';

/**
 * Access authentication state and actions.
 *
 * Must be used inside `<Providers>` (which includes `<AuthProvider>`).
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, signOut } = useAuth();
 *
 * if (!isAuthenticated) return <ConnectWalletPrompt />;
 * return <Dashboard user={user} />;
 * ```
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth must be used inside <Providers>. ' +
        'Ensure src/app/layout.tsx wraps children with <Providers>.',
    );
  }
  return ctx;
}
