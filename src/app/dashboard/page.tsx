'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart3, BookOpen, Home, Settings, Trophy, UserRound } from 'lucide-react';
import { DashboardView } from '@/components/sections/dashboard-view';
import { useAuth } from '@/hooks/useAuth';
import { IntlLink, useIntlPathname, useIntlRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'dashboard', icon: Home },
  { href: '/courses', labelKey: 'courses', icon: BookOpen },
  { href: '/leaderboard', labelKey: 'leaderboard', icon: Trophy },
  { href: '/profile', labelKey: 'profile', icon: UserRound },
  { href: '/settings', labelKey: 'settings', icon: Settings },
] as const;

export default function DashboardPage() {
  const t = useTranslations();
  const router = useIntlRouter();
  const pathname = useIntlPathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
          <div className="mt-4 h-64 animate-pulse rounded-2xl border border-border bg-surface" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <BarChart3 className="text-accent-cyan" size={20} />
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            {t('dashboard.title')}
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <aside className="h-fit rounded-2xl border border-border bg-surface p-3">
            <nav className="space-y-1" aria-label="Dashboard navigation">
              {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
                const active = href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href);

                return (
                  <IntlLink
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-accent-cyan/10 text-accent-cyan'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary',
                    )}
                  >
                    <Icon size={16} />
                    {t(`nav.${labelKey}`)}
                  </IntlLink>
                );
              })}
            </nav>
          </aside>

          <DashboardView />
        </div>
      </section>
    </main>
  );
}
