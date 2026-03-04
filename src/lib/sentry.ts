import { createElement, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

const rawDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_DSN = rawDsn && !rawDsn.includes('<') ? rawDsn : undefined;

let clientInitialized = false;
let serverInitialized = false;

export function initSentryClient(): void {
  if (typeof window === 'undefined' || clientInitialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: process.env.NODE_ENV,
  });

  clientInitialized = true;
}

export function initSentryServer(): void {
  if (typeof window !== 'undefined' || serverInitialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: process.env.NODE_ENV,
  });

  serverInitialized = true;
}

export function captureException(error: unknown): void {
  if (!SENTRY_DSN) return;
  Sentry.captureException(error);
}

export function SentryErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  initSentryClient();

  return createElement(
    Sentry.ErrorBoundary,
    {
      fallback: createElement(
        'div',
        {
          style: {
            minHeight: '40vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          },
        },
        'Something went wrong.',
      ),
      showDialog: false,
    },
    children,
  );
}
