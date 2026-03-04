'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { LevelBadge } from '@/components/ui/level-badge';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { trackLeaderboardView } from '@/lib/analytics';
import { cn, truncateAddress } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';
import type { LeaderboardTimeframe } from '@/services';

interface CourseFilterOption {
  value: string;
  label: string;
}

interface LeaderboardViewProps {
  initialLeaderboard: LeaderboardEntry[];
  courseFilterOptions: CourseFilterOption[];
}

const TIMEFRAME_OPTIONS: LeaderboardTimeframe[] = ['all', 'monthly', 'weekly'];

function rankChangeIndicator(change: number) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-accent-green">
        <ArrowUpRight size={14} />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <ArrowDownRight size={14} />
        {Math.abs(change)}
      </span>
    );
  }
  return <span className="text-text-muted">—</span>;
}

export function LeaderboardView({
  initialLeaderboard,
  courseFilterOptions,
}: LeaderboardViewProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [courseFilter, setCourseFilter] = useState('all');
  const [rowsVisible, setRowsVisible] = useState(7);

  const {
    data,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    refresh,
  } = useLeaderboard({
    initialTimeframe: 'all',
    initialData: initialLeaderboard,
  });

  const filteredRows = useMemo(() => {
    const rows = data ?? [];
    if (courseFilter === 'all') return rows;
    return rows.filter((entry) => entry.coursesCompleted > 0);
  }, [courseFilter, data]);

  const podium = filteredRows.slice(0, 3);
  const rankingRows = filteredRows.slice(3, 3 + rowsVisible);
  const canShowMore = filteredRows.length > 3 + rowsVisible;

  const comparisonMap = useMemo(() => {
    const map = new Map<string, number>();
    initialLeaderboard.forEach((entry, index) => map.set(entry.userId, index + 1));
    return map;
  }, [initialLeaderboard]);

  const yourRank = filteredRows.find((entry) => entry.userId === user?.id);

  useEffect(() => {
    trackLeaderboardView(timeframe);
  }, [timeframe]);

  const timeframeLabel = (value: LeaderboardTimeframe): string => {
    if (value === 'all') return t('leaderboard.all_time');
    if (value === 'monthly') return t('leaderboard.this_month');
    return t('leaderboard.this_week');
  };

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">{t('leaderboard.title')}</h1>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">
            {t('leaderboard.subtitle')}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap rounded-xl border border-border bg-background p-1">
              {TIMEFRAME_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setRowsVisible(7);
                    setTimeframe(option);
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    timeframe === option
                      ? 'bg-accent-cyan/15 text-accent-cyan'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                  aria-pressed={timeframe === option}
                >
                  {timeframeLabel(option)}
                </button>
              ))}
            </div>

            <label className="ml-auto flex items-center gap-2 text-sm text-text-secondary">
              {t('leaderboard.course_filter')}
              <select
                value={courseFilter}
                onChange={(event) => {
                  setRowsVisible(7);
                  setCourseFilter(event.target.value);
                }}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              >
                {courseFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === 'all' ? t('leaderboard.all_courses') : option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-destructive/35 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error.message}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-3 rounded-lg bg-accent-cyan px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {podium.length === 3 && (
          <section className="mb-6 hidden gap-4 md:grid md:grid-cols-3">
            {[podium[1], podium[0], podium[2]].map((entry, index) => {
              const isFirst = index === 1;
              return (
                <article
                  key={entry.userId}
                  className={cn(
                    'relative rounded-2xl border p-5 text-center',
                    isFirst
                      ? 'border-xp/50 bg-xp/10 md:-translate-y-2'
                      : index === 0
                        ? 'border-border bg-surface md:translate-y-2'
                        : 'border-accent-purple/35 bg-accent-purple/10 md:translate-y-4',
                  )}
                >
                  {isFirst && (
                    <Crown
                      className="absolute left-1/2 top-2 -translate-x-1/2 text-xp"
                      size={18}
                    />
                  )}
                  <div className="mx-auto mb-3 mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-text-primary">
                    {(entry.displayName || entry.username).slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    {entry.displayName || entry.username}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">{entry.xp.toLocaleString()} XP</p>
                  <div className="mt-3 flex justify-center">
                    <LevelBadge level={entry.level} size="sm" />
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-background/40 text-left text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3">{t('leaderboard.rank')}</th>
                  <th className="px-4 py-3">{t('leaderboard.name')}</th>
                  <th className="px-4 py-3">{t('leaderboard.level')}</th>
                  <th className="px-4 py-3">{t('leaderboard.xp')}</th>
                  <th className="px-4 py-3">{t('leaderboard.streak')}</th>
                  <th className="px-4 py-3">{t('leaderboard.trend')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && filteredRows.length === 0
                  ? Array.from({ length: 7 }, (_, index) => (
                      <tr key={`skeleton-${index}`} className="border-b border-border last:border-b-0">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="h-8 animate-pulse rounded bg-surface-2" />
                        </td>
                      </tr>
                    ))
                  : rankingRows.map((entry) => {
                      const currentRank = entry.rank;
                      const previousRank = comparisonMap.get(entry.userId) ?? currentRank;
                      const change = previousRank - currentRank;
                      const isCurrentUser = entry.userId === user?.id;

                      return (
                        <tr
                          key={entry.userId}
                          className={cn(
                            'border-b border-border last:border-b-0',
                            isCurrentUser && 'bg-accent-cyan/10 ring-1 ring-inset ring-accent-cyan/50',
                          )}
                        >
                          <td className="px-4 py-3 font-semibold text-text-primary">#{entry.rank}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-text-primary">
                                {(entry.displayName || entry.username).slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-text-primary">
                                  {entry.displayName || entry.username}
                                </p>
                                <p className="truncate text-xs text-text-muted">
                                  {truncateAddress(entry.walletAddress)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <LevelBadge level={entry.level} size="sm" />
                          </td>
                          <td className="px-4 py-3 font-mono text-text-primary">
                            {entry.xp.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{entry.streak}d</td>
                          <td className="px-4 py-3">{rankChangeIndicator(change)}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-text-muted">
            <p>{t('leaderboard.showing_of', { shown: Math.min(3 + rowsVisible, filteredRows.length), total: filteredRows.length })}</p>
            {canShowMore && (
              <button
                type="button"
                onClick={() => setRowsVisible((value) => value + 10)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                {t('leaderboard.show_more')}
              </button>
            )}
          </div>
        </section>
      </section>

      <div className="fixed bottom-3 left-3 right-3 z-30 rounded-xl border border-accent-cyan/35 bg-background/95 p-3 shadow-xl backdrop-blur md:hidden">
        <p className="text-xs uppercase tracking-wider text-text-muted">{t('leaderboard.your_rank')}</p>
        <p className="mt-1 text-sm font-semibold text-text-primary">
          {yourRank
            ? t('leaderboard.your_rank_of', { rank: yourRank.rank, total: filteredRows.length })
            : t('leaderboard.unranked_of', { total: filteredRows.length })}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
          <TrendingUp size={14} />
          {t('leaderboard.keep_learning')}
        </div>
      </div>
    </main>
  );
}
