'use client';

import { Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { SolanaProvider } from './SolanaProvider';
import { AuthProvider } from './AuthProvider';
import { XPProvider } from './XPProvider';
import { AnalyticsProvider } from '@/lib/analytics';
import { SentryErrorBoundary } from '@/lib/sentry';

/**
 * Unified provider tree for the entire application.
 *
 * Order matters:
 *   ThemeProvider     — no deps, must wrap everything for SSR class injection
 *   └─ SolanaProvider — ConnectionProvider → WalletProvider → WalletModalProvider
 *      └─ AuthProvider — consumes useWallet() → must be inside WalletProvider
 *         └─ XPProvider — consumes AuthContext + useWallet() → innermost
 *
 * Usage: import this in src/app/layout.tsx as the sole client boundary.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SentryErrorBoundary>
      <Suspense fallback={null}>
        <AnalyticsProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <SolanaProvider>
              <AuthProvider>
                <XPProvider>{children}</XPProvider>
              </AuthProvider>
            </SolanaProvider>
          </ThemeProvider>
        </AnalyticsProvider>
      </Suspense>
    </SentryErrorBoundary>
  );
}
