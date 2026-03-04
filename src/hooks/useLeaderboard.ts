'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { learningService } from '@/services';
import { getCache, setCache } from '@/lib/cache';
import type { LeaderboardEntry } from '@/types';
import type { LeaderboardTimeframe } from '@/services';

// ─── Cache config ─────────────────────────────────────────────────────────────

/** Leaderboard data is relatively static — 2-minute TTL is fine. */
const LEADERBOARD_TTL = 2 * 60_000;

const cacheKey = (tf: LeaderboardTimeframe) => `leaderboard:${tf}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseLeaderboardReturn {
  data: LeaderboardEntry[] | null;
  isLoading: boolean;
  /** Non-null when the most recent fetch failed. */
  error: Error | null;
  /** Timeframe currently displayed. */
  timeframe: LeaderboardTimeframe;
  /** Change timeframe — triggers a refetch (cache-first). */
  setTimeframe: (tf: LeaderboardTimeframe) => void;
  /** Force a fresh fetch, bypassing the cache. */
  refresh: () => Promise<void>;
}

export interface UseLeaderboardOptions {
  initialTimeframe?: LeaderboardTimeframe;
  initialData?: LeaderboardEntry[] | null;
}

/**
 * Fetches and caches the global leaderboard with SWR-like behaviour:
 * - Returns stale data immediately while revalidating in the background.
 * - Revalidates on window focus.
 * - Supports `weekly`, `monthly`, and `all` timeframes.
 *
 * @example
 * ```tsx
 * const { data, isLoading, timeframe, setTimeframe } = useLeaderboard();
 *
 * return (
 *   <>
 *     <TabBar active={timeframe} onChange={setTimeframe} />
 *     {isLoading && !data ? <Skeleton /> : <Table rows={data ?? []} />}
 *   </>
 * );
 * ```
 */
export function useLeaderboard({
  initialTimeframe = 'weekly',
  initialData = null,
}: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const [timeframe, setTimeframeState] = useState<LeaderboardTimeframe>(initialTimeframe);
  const [data, setData] = useState<LeaderboardEntry[] | null>(
    () => initialData ?? getCache<LeaderboardEntry[]>(cacheKey(initialTimeframe)),
  );
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!initialData) return;
    setCache(cacheKey(initialTimeframe), initialData, LEADERBOARD_TTL);
  }, [initialData, initialTimeframe]);

  // Prevent duplicate concurrent fetches for the same timeframe.
  const fetchingRef = useRef<Set<LeaderboardTimeframe>>(new Set());

  const fetchLeaderboard = useCallback(
    async (tf: LeaderboardTimeframe, bypassCache = false) => {
      if (fetchingRef.current.has(tf)) return;

      // Serve stale data immediately (stale-while-revalidate)
      if (!bypassCache) {
        const cached = getCache<LeaderboardEntry[]>(cacheKey(tf));
        if (cached) {
          setData(cached);
          setIsLoading(false);
          // Still revalidate silently in background
        }
      }

      fetchingRef.current.add(tf);
      if (!data || bypassCache) setIsLoading(true);
      setError(null);

      try {
        const fresh = await learningService.getLeaderboard(tf);
        setCache(cacheKey(tf), fresh, LEADERBOARD_TTL);
        setData(fresh);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
      } finally {
        setIsLoading(false);
        fetchingRef.current.delete(tf);
      }
    },
    [data],
  );

  // Fetch whenever timeframe changes.
  useEffect(() => {
    fetchLeaderboard(timeframe);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  // Revalidate on window focus (background sync).
  useEffect(() => {
    const handler = () => fetchLeaderboard(timeframe);
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [timeframe, fetchLeaderboard]);

  const setTimeframe = useCallback(
    (tf: LeaderboardTimeframe) => {
      setTimeframeState(tf);
      // Immediately show cached data for the new timeframe if available.
      const cached = getCache<LeaderboardEntry[]>(cacheKey(tf));
      if (cached) setData(cached);
      else setIsLoading(true);
    },
    [],
  );

  const refresh = useCallback(
    () => fetchLeaderboard(timeframe, true),
    [fetchLeaderboard, timeframe],
  );

  return { data, isLoading, error, timeframe, setTimeframe, refresh };
}
