'use client';

import { useTranslations } from 'next-intl';

interface ProfileErrorProps {
  error: Error;
  reset: () => void;
}

export default function ProfileError({ error, reset }: ProfileErrorProps) {
  const t = useTranslations();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-text-primary">{t('common.error')}</h1>
        <p className="mt-3 text-sm text-text-secondary">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {t('common.retry')}
        </button>
      </section>
    </main>
  );
}
