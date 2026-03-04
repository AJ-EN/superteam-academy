'use client';

import { useTranslations } from 'next-intl';

interface CourseDetailErrorProps {
  error: Error;
  reset: () => void;
}

export default function CourseDetailError({
  error,
  reset,
}: CourseDetailErrorProps) {
  const t = useTranslations();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-text-primary">{t('common.error')}</h1>
        <p className="mt-3 text-sm text-text-secondary">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/60"
        >
          {t('common.retry')}
        </button>
      </section>
    </main>
  );
}
