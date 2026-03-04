'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Flame,
  Medal,
  Trophy,
  UserRoundCheck,
  Zap,
} from 'lucide-react';
import { AchievementBadge } from '@/components/ui/achievement-badge';
import { CourseCard } from '@/components/ui/course-card';
import { LevelBadge } from '@/components/ui/level-badge';
import { StreakCalendar } from '@/components/ui/streak-calendar';
import { XPBar } from '@/components/ui/xp-bar';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useSolana } from '@/hooks/useSolana';
import { useXP } from '@/hooks/useXP';
import { IntlLink } from '@/i18n/navigation';
import { getStoredCourseProgress } from '@/lib/course-progress';
import { formatXP, timeAgo } from '@/lib/utils';
import { urlFor } from '@/sanity/lib/image';
import { cn } from '@/lib/utils';

function CardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wider text-text-muted">{title}</p>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function toHours(durationMinutes: number | null): number {
  if (!durationMinutes || durationMinutes <= 0) return 1;
  return Math.max(1, Math.round(durationMinutes / 60));
}

function formatCourseTitle(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function DashboardView() {
  const t = useTranslations();
  const { user } = useAuth();
  const { xp, level, levelProgress } = useXP();
  const { connected } = useSolana();
  const {
    streakData,
    courseProgress,
    rankSummary,
    dailyXPActivity,
    recentActivity,
    allCourses,
    featuredCourses,
    achievements,
    isLoading,
    error,
    refresh,
  } = useDashboard(user);

  const courseTitleBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const course of allCourses) {
      map.set(course.slug.current, course.title);
    }
    return map;
  }, [allCourses]);

  const completedCourses = courseProgress.filter((item) => item.status === 'completed').length;
  const enrolledCourses = courseProgress.length;

  const activeCourses = useMemo(() => {
    const items = courseProgress
      .filter((record) => record.status !== 'completed')
      .map((record) => {
        const course = allCourses.find(
          (item) =>
            item.slug.current === record.courseSlug ||
            item._id === record.courseId,
        );
        if (!course) return null;

        const localProgress = getStoredCourseProgress(course.slug.current);
        const progressPct = record.totalLessons > 0
          ? Math.round((record.completedLessons / record.totalLessons) * 100)
          : 0;

        return {
          id: record.courseId,
          slug: course.slug.current,
          title: course.title,
          thumbnail: course.thumbnail,
          progressPct,
          continueHref: localProgress.lastVisitedLessonId
            ? `/courses/${course.slug.current}/lessons/${encodeURIComponent(localProgress.lastVisitedLessonId)}`
            : `/courses/${course.slug.current}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return items;
  }, [allCourses, courseProgress]);

  const recommendedCourses = useMemo(() => {
    const enrolledSlugs = new Set(
      courseProgress
        .map((item) => item.courseSlug)
        .filter((value): value is string => Boolean(value)),
    );

    return featuredCourses
      .filter((course) => !enrolledSlugs.has(course.slug.current))
      .slice(0, 3);
  }, [courseProgress, featuredCourses]);

  const recentAchievements = useMemo(() => {
    const unlocked = achievements.filter((item) => item.unlocked);
    const locked = achievements.filter((item) => !item.unlocked);
    const selected = [
      ...unlocked.slice(-6),
      ...locked.slice(0, Math.max(0, 6 - unlocked.length)),
    ];
    return selected.slice(0, 6);
  }, [achievements]);

  const milestones = [7, 30, 100];
  const streakValue = streakData?.currentStreak ?? user?.streak ?? 0;
  const longestStreak = streakData?.longestStreak ?? user?.streak ?? 0;

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-destructive">{error.message}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardShell title={t('dashboard.current_xp')}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-2xl font-bold text-text-primary">{formatXP(xp)}</p>
            <LevelBadge level={level} size="sm" />
          </div>
          <XPBar
            xp={xp}
            level={level}
            levelProgress={levelProgress}
            showLabel={false}
            className="mt-4"
          />
        </CardShell>

        <CardShell title={t('dashboard.current_streak')}>
          <div className="flex items-center gap-2">
            <Flame aria-hidden className="text-xp" size={18} />
            <p className="text-2xl font-bold text-text-primary">{streakValue}</p>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{t('common.streak')}</p>
          <p className="mt-3 text-xs text-text-muted">{t('dashboard.best_streak', { days: longestStreak })}</p>
        </CardShell>

        <CardShell title={t('dashboard.courses_completed')}>
          <div className="flex items-center gap-2">
            <Trophy aria-hidden className="text-xp" size={18} />
            <p className="text-2xl font-bold text-text-primary">{completedCourses}</p>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{t('dashboard.of_enrolled', { count: enrolledCourses })}</p>
          <p className="mt-3 text-xs text-text-muted">
            {t('dashboard.keep_progressing')}
          </p>
        </CardShell>

        <CardShell title={t('dashboard.global_rank')}>
          <div className="flex items-center gap-2">
            <Medal aria-hidden className="text-accent-cyan" size={18} />
            <p className={cn(
              'text-2xl font-bold',
              rankSummary?.rank ? 'text-text-primary' : 'text-text-muted',
            )}>
              {rankSummary?.rank ? `#${rankSummary.rank}` : '--'}
            </p>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {rankSummary?.percentile
              ? t('dashboard.top_percent', { percent: rankSummary.percentile })
              : t('dashboard.not_enough_data')}
          </p>
          {!connected && (
            <p className="mt-3 text-xs text-text-muted">{t('dashboard.connect_wallet_rank_sync')}</p>
          )}
        </CardShell>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-text-primary">{t('dashboard.continue_learning')}</h2>
          <IntlLink href="/courses" className="text-sm font-medium text-accent-cyan hover:opacity-80">
            {t('dashboard.browse_all')}
          </IntlLink>
        </div>

        {isLoading && activeCourses.length === 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-44 min-w-[260px] animate-pulse rounded-xl border border-border bg-surface-2"
              />
            ))}
          </div>
        ) : activeCourses.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activeCourses.map((course) => (
              <article
                key={course.id}
                className="min-w-[280px] overflow-hidden rounded-xl border border-border bg-background"
              >
                <div className="relative h-32 bg-surface-2">
                  {course.thumbnail ? (
                    <Image
                      src={urlFor(course.thumbnail).width(600).height(280).format('webp').url()}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      <UserRoundCheck size={22} />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="line-clamp-1 text-sm font-semibold text-text-primary">{course.title}</h3>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                      <span>{t('dashboard.progress')}</span>
                      <span>{course.progressPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent-cyan"
                        style={{ width: `${course.progressPct}%` }}
                      />
                    </div>
                  </div>
                  <IntlLink
                    href={course.continueHref}
                    className="inline-flex rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1.5 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/20"
                  >
                    {t('dashboard.continue_button')}
                  </IntlLink>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-background px-4 py-10 text-center">
            <p className="text-sm text-text-secondary">{t('dashboard.no_courses_yet')}</p>
            <IntlLink
              href="/courses"
              className="mt-4 inline-flex rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t('dashboard.browse_courses')}
            </IntlLink>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{t('dashboard.your_activity')}</h2>
            <div className="flex items-center gap-2">
              {milestones.map((milestone) => {
                const unlocked = streakValue >= milestone;
                return (
                  <span
                    key={milestone}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold',
                      unlocked
                        ? 'border-accent-green/40 bg-accent-green/10 text-accent-green'
                        : 'border-border text-text-muted',
                    )}
                  >
                    {milestone}d
                  </span>
                );
              })}
            </div>
          </div>
          <StreakCalendar
            streakData={streakData ?? {
              userId: user?.id ?? '',
              currentStreak: user?.streak ?? 0,
              longestStreak: user?.streak ?? 0,
              lastActivityDate: new Date().toISOString().split('T')[0] ?? '',
              freezesRemaining: 0,
              totalActiveDays: 0,
            }}
            activity={dailyXPActivity}
          />
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">{t('dashboard.recent_achievements')}</h2>
              <IntlLink href={`/profile/${user?.username ?? ''}`} className="text-xs text-accent-cyan hover:opacity-80">
                {t('dashboard.view_all')}
              </IntlLink>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recentAchievements.map((item) => (
                <AchievementBadge
                  key={item.achievement.id}
                  achievement={item.achievement}
                  unlocked={item.unlocked}
                  size="md"
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-text-primary">{t('dashboard.recent_activity')}</h2>
            <ul className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <li key={activity.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm text-text-secondary">
                      {activity.type === 'completed_lesson' && (
                        t('dashboard.completed_lesson_in', {
                          lesson: activity.lessonId ?? t('dashboard.lesson_fallback'),
                          course: activity.courseSlug
                            ? (courseTitleBySlug.get(activity.courseSlug) ?? formatCourseTitle(activity.courseSlug))
                            : t('dashboard.course_fallback'),
                        })
                      )}
                      {activity.type === 'earned_achievement' && (
                        t('dashboard.earned_badge', {
                          achievement: activity.label.replace(/^Earned\s+/i, '').replace(/\s+badge$/i, ''),
                        })
                      )}
                      {activity.type === 'enrolled' && (
                        t('dashboard.enrolled_in', {
                          course: activity.courseSlug
                            ? (courseTitleBySlug.get(activity.courseSlug) ?? formatCourseTitle(activity.courseSlug))
                            : t('dashboard.course_fallback'),
                        })
                      )}
                      {activity.type === 'leveled_up' && (
                        t('dashboard.reached_level', { level: activity.value ?? level })
                      )}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">{timeAgo(activity.timestamp)}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-lg border border-border bg-background p-3 text-sm text-text-muted">
                  {t('dashboard.no_activity_yet')}
                </li>
              )}
            </ul>
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{t('dashboard.recommended')}</h2>
          <Zap aria-hidden className="text-accent-cyan" size={18} />
        </div>
        {recommendedCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendedCourses.map((course) => (
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
                tags={[course.track.replace('-', ' '), course.language]}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            {t('dashboard.recommendation_hint')}
          </p>
        )}
      </section>
    </div>
  );
}
