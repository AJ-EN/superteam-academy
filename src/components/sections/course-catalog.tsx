'use client';

import { useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { CourseCard } from '@/components/ui/course-card';
import { cn } from '@/lib/utils';
import { urlFor } from '@/sanity/lib/image';
import type { SanityCourseSummary } from '@/sanity/lib/queries';

type Course = SanityCourseSummary & {
  moduleCount?: number;
};

type DifficultyFilter = 'all' | Course['difficulty'];
type TrackFilter = 'all' | Course['track'];
type DurationFilter = 'any' | 'under-2h' | '2-5h' | '5h-plus';
type SortOption = 'popular' | 'newest' | 'xp-reward';

const DIFFICULTY_OPTIONS: DifficultyFilter[] = [
  'all',
  'beginner',
  'intermediate',
  'advanced',
];

const TRACK_OPTIONS: TrackFilter[] = [
  'all',
  'fundamentals',
  'defi',
  'security',
  'full-stack',
];

const DURATION_OPTIONS: DurationFilter[] = ['any', 'under-2h', '2-5h', '5h-plus'];
const SORT_OPTIONS: SortOption[] = ['popular', 'newest', 'xp-reward'];

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="h-44 bg-surface-2" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 w-2/3 rounded bg-surface-2" />
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-3 w-5/6 rounded bg-surface-2" />
        <div className="h-3 w-1/2 rounded bg-surface-2" />
      </div>
    </div>
  );
}

function pillClass(active: boolean): string {
  return cn(
    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
      : 'border-border bg-surface text-text-secondary hover:text-text-primary',
  );
}

function toHours(durationMinutes: number | null): number {
  if (!durationMinutes || durationMinutes <= 0) return 1;
  return Math.max(1, Math.round(durationMinutes / 60));
}

function matchesDuration(durationMinutes: number | null, filter: DurationFilter): boolean {
  if (filter === 'any') return true;
  if (!durationMinutes || durationMinutes <= 0) return false;
  if (filter === 'under-2h') return durationMinutes < 120;
  if (filter === '2-5h') return durationMinutes >= 120 && durationMinutes < 300;
  return durationMinutes >= 300;
}

function isDifficultyFilter(value: string | null): value is DifficultyFilter {
  return DIFFICULTY_OPTIONS.includes(value as DifficultyFilter);
}

function isTrackFilter(value: string | null): value is TrackFilter {
  return TRACK_OPTIONS.includes(value as TrackFilter);
}

function isDurationFilter(value: string | null): value is DurationFilter {
  return DURATION_OPTIONS.includes(value as DurationFilter);
}

function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.includes(value as SortOption);
}

interface CourseCatalogProps {
  courses: Course[];
}

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>(() => {
    const value = searchParams.get('difficulty');
    return isDifficultyFilter(value) ? value : 'all';
  });
  const [trackFilter, setTrackFilter] = useState<TrackFilter>(() => {
    const value = searchParams.get('track');
    return isTrackFilter(value) ? value : 'all';
  });
  const [durationFilter, setDurationFilter] = useState<DurationFilter>(() => {
    const value = searchParams.get('duration');
    return isDurationFilter(value) ? value : 'any';
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const value = searchParams.get('sort');
    return isSortOption(value) ? value : 'popular';
  });
  const [isPending, startTransition] = useTransition();

  const applyFilters = (nextValues: {
    searchQuery?: string;
    difficultyFilter?: DifficultyFilter;
    trackFilter?: TrackFilter;
    durationFilter?: DurationFilter;
    sortBy?: SortOption;
  }) => {
    const nextSearchQuery = nextValues.searchQuery ?? searchQuery;
    const nextDifficulty = nextValues.difficultyFilter ?? difficultyFilter;
    const nextTrack = nextValues.trackFilter ?? trackFilter;
    const nextDuration = nextValues.durationFilter ?? durationFilter;
    const nextSort = nextValues.sortBy ?? sortBy;

    setSearchQuery(nextSearchQuery);
    setDifficultyFilter(nextDifficulty);
    setTrackFilter(nextTrack);
    setDurationFilter(nextDuration);
    setSortBy(nextSort);

    const params = new URLSearchParams();

    if (nextSearchQuery.trim()) params.set('q', nextSearchQuery.trim());
    if (nextDifficulty !== 'all') params.set('difficulty', nextDifficulty);
    if (nextTrack !== 'all') params.set('track', nextTrack);
    if (nextDuration !== 'any') params.set('duration', nextDuration);
    if (nextSort !== 'popular') params.set('sort', nextSort);

    const next = params.toString();
    if (next === searchParams.toString()) return;

    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  };

  const filteredCourses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = courses.filter((course) => {
      const text = `${course.title} ${course.description ?? ''}`.toLowerCase();
      const searchMatch = normalizedQuery.length === 0 || text.includes(normalizedQuery);
      const difficultyMatch =
        difficultyFilter === 'all' || course.difficulty === difficultyFilter;
      const trackMatch = trackFilter === 'all' || course.track === trackFilter;
      const durationMatch = matchesDuration(course.duration, durationFilter);

      return searchMatch && difficultyMatch && trackMatch && durationMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'xp-reward') return b.xpReward - a.xpReward;
      if (sortBy === 'newest') return b.order - a.order;
      return a.order - b.order;
    });
  }, [courses, difficultyFilter, durationFilter, searchQuery, sortBy, trackFilter]);

  const showSkeleton = isPending;

  const clearFilters = () => {
    applyFilters({
      searchQuery: '',
      difficultyFilter: 'all',
      trackFilter: 'all',
      durationFilter: 'any',
      sortBy: 'popular',
    });
  };

  const difficultyLabel = (value: DifficultyFilter): string => {
    if (value === 'all') return t('courses.filter_all');
    if (value === 'beginner') return t('courses.filter_beginner');
    if (value === 'intermediate') return t('courses.filter_intermediate');
    return t('courses.filter_advanced');
  };

  const trackLabel = (value: TrackFilter): string => {
    if (value === 'all') return t('courses.filter_all');
    if (value === 'fundamentals') return t('courses.track_fundamentals');
    if (value === 'defi') return t('courses.track_defi');
    if (value === 'security') return t('courses.track_security');
    return t('courses.track_full_stack');
  };

  const durationLabel = (value: DurationFilter): string => {
    if (value === 'any') return t('courses.duration_any');
    if (value === 'under-2h') return t('courses.duration_under_2h');
    if (value === '2-5h') return t('courses.duration_2_5h');
    return t('courses.duration_5h_plus');
  };

  const sortLabel = (value: SortOption): string => {
    if (value === 'popular') return t('courses.sort_popular');
    if (value === 'newest') return t('courses.sort_newest');
    return t('courses.sort_xp_reward');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          {t('courses.title')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary sm:text-base">
          {t('courses.subtitle')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-5">
            <label
              htmlFor="course-search"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
              {t('courses.search_label')}
            </label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={16}
              />
              <input
                id="course-search"
                type="text"
                value={searchQuery}
                onChange={(event) => applyFilters({ searchQuery: event.target.value })}
                placeholder={t('courses.search_placeholder')}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring/60"
              />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t('courses.filter_difficulty')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={pillClass(difficultyFilter === option)}
                    onClick={() => applyFilters({ difficultyFilter: option })}
                    aria-pressed={difficultyFilter === option}
                  >
                    {difficultyLabel(option)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t('courses.filter_track')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {TRACK_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={pillClass(trackFilter === option)}
                    onClick={() => applyFilters({ trackFilter: option })}
                    aria-pressed={trackFilter === option}
                  >
                    {trackLabel(option)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t('courses.filter_duration')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={pillClass(durationFilter === option)}
                    onClick={() => applyFilters({ durationFilter: option })}
                    aria-pressed={durationFilter === option}
                  >
                    {durationLabel(option)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              {t('courses.showing_count', { count: filteredCourses.length })}
            </p>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              {t('courses.sort_by')}
              <select
                value={sortBy}
                onChange={(event) => applyFilters({ sortBy: event.target.value as SortOption })}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {sortLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {showSkeleton ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <CourseCardSkeleton key={`catalog-skeleton-${index}`} />
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  title={course.title}
                  description={course.description ?? ''}
                  thumbnailUrl={
                    course.thumbnail
                      ? urlFor(course.thumbnail).width(640).height(360).format('webp').url()
                      : null
                  }
                  difficulty={course.difficulty}
                  xpReward={course.xpReward}
                  estimatedHours={toHours(course.duration)}
                  slug={course.slug.current}
                  moduleCount={course.moduleCount}
                  tags={[
                    course.track.replace('-', ' '),
                    course.language,
                  ]}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
              <Search aria-hidden className="mx-auto mb-3 text-text-muted" size={28} />
              <h3 className="text-lg font-semibold text-text-primary">{t('courses.no_results_title')}</h3>
              <p className="mt-2 text-sm text-text-secondary">
                {t('courses.no_results_body')}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 px-4 py-2 text-sm font-medium text-accent-cyan hover:bg-accent-cyan/15 focus:outline-none focus:ring-2 focus:ring-ring/60"
              >
                {t('courses.clear_filters')}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
