'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIntlRouter } from '@/i18n/navigation';

export default function ProfileRedirectPage() {
  const router = useIntlRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user?.username) {
      router.replace('/');
      return;
    }

    router.replace(`/profile/${user.username}`);
  }, [isAuthenticated, isLoading, router, user?.username]);

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-text-secondary">Redirecting to your profile...</p>
      </section>
    </main>
  );
}
