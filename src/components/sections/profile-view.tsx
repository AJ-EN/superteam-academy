'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Github,
  ShieldCheck,
  Twitter,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { AchievementBadge } from '@/components/ui/achievement-badge';
import { LevelBadge } from '@/components/ui/level-badge';
import { useAuth } from '@/hooks/useAuth';
import { getAchievementProgress } from '@/lib/achievements';
import { cn, formatXP, truncateAddress } from '@/lib/utils';
import { contentService, userProfileService } from '@/services';
import { CredentialService } from '@/services/chain/CredentialService';
import type { CourseProgress, Credential, User } from '@/types';
import type { SanityCourseSummary } from '@/sanity/lib/queries';

type AchievementFilter = 'all' | 'earned' | 'locked';

interface ProfileViewProps {
  user: User;
  isOwnProfile: boolean;
}

interface RankSummary {
  rank: number | null;
  totalDevelopers: number;
  percentile: number | null;
}

const credentialService = new CredentialService();

function formatTrack(track: string): string {
  return track
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getInitials(display: string): string {
  const parts = display.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? 'ST';
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export function ProfileView({ user, isOwnProfile }: ProfileViewProps) {
  const auth = useAuth();
  const isOwner = isOwnProfile || auth.user?.id === user.id;

  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [rankSummary, setRankSummary] = useState<RankSummary | null>(null);
  const [streak, setStreak] = useState(user.streak);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [courses, setCourses] = useState<SanityCourseSummary[]>([]);
  const [achievementFilter, setAchievementFilter] = useState<AchievementFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [progress, rank, streakData, allCourses, creds] = await Promise.all([
          userProfileService.getCourseProgress(user.id).catch(() => []),
          userProfileService.getGlobalRank(user.id).catch(() => ({
            rank: null,
            totalDevelopers: 0,
            percentile: null,
          })),
          userProfileService.getStreakData(user.id).catch(() => null),
          contentService.getAllCourses().catch(() => []),
          user.walletAddress
            ? credentialService.getCredentials(user.walletAddress).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (cancelled) return;
        setCourseProgress(progress);
        setRankSummary(rank);
        setStreak(streakData?.currentStreak ?? user.streak);
        setCourses(allCourses);
        setCredentials(creds);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError
            : new Error('Failed to load profile data.'),
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user.id, user.streak, user.walletAddress]);

  const courseBySlug = useMemo(() => {
    const map = new Map<string, SanityCourseSummary>();
    for (const course of courses) map.set(course.slug.current, course);
    return map;
  }, [courses]);

  const completedCourses = useMemo(
    () => courseProgress.filter((item) => item.status === 'completed'),
    [courseProgress],
  );

  const achievements = useMemo(() => {
    return getAchievementProgress({
      xp: user.xp,
      streak,
      coursesCompleted: completedCourses.length,
    });
  }, [completedCourses.length, streak, user.xp]);

  const visibleAchievements = useMemo(() => {
    if (achievementFilter === 'earned') return achievements.filter((item) => item.unlocked);
    if (achievementFilter === 'locked') return achievements.filter((item) => !item.unlocked);
    return achievements;
  }, [achievementFilter, achievements]);

  const skillData = useMemo(() => {
    const trackCounts = {
      fundamentals: 0,
      defi: 0,
      security: 0,
      'full-stack': 0,
    };

    for (const completed of completedCourses) {
      const course = completed.courseSlug ? courseBySlug.get(completed.courseSlug) : null;
      if (!course) continue;
      trackCounts[course.track] += 1;
    }

    const advancedWeight = completedCourses.length * 8;

    return [
      { skill: 'Rust', value: Math.min(100, trackCounts.fundamentals * 24 + advancedWeight) },
      { skill: 'Anchor', value: Math.min(100, trackCounts.fundamentals * 18 + trackCounts['full-stack'] * 12 + advancedWeight) },
      { skill: 'Frontend', value: Math.min(100, trackCounts['full-stack'] * 30 + completedCourses.length * 6) },
      { skill: 'DeFi', value: Math.min(100, trackCounts.defi * 36 + completedCourses.length * 4) },
      { skill: 'Security', value: Math.min(100, trackCounts.security * 36 + completedCourses.length * 4) },
    ];
  }, [completedCourses, courseBySlug]);

  const stats = {
    coursesCompleted: completedCourses.length,
    achievementsEarned: achievements.filter((item) => item.unlocked).length,
    currentStreak: streak,
    globalRank: rankSummary?.rank,
  };

  if (isLoading) {
    return (
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-32 animate-pulse rounded-2xl border border-border bg-surface" />
          <div className="mt-6 h-56 animate-pulse rounded-2xl border border-border bg-surface" />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-destructive">{error.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan/20 via-accent-purple/20 to-accent-green/20 text-2xl font-bold text-text-primary">
                {getInitials(user.displayName || user.username)}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {user.displayName || user.username}
                </h1>
                <p className="text-sm text-text-secondary">@{user.username}</p>
                <p className="mt-2 max-w-xl text-sm text-text-secondary">
                  {user.bio ?? 'Building on Solana, one lesson at a time.'}
                </p>
                <p className="mt-2 text-xs text-text-muted">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  {user.twitterUrl && (
                    <Link
                      href={user.twitterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
                    >
                      <Twitter size={14} />
                      Twitter
                    </Link>
                  )}
                  {user.githubUrl && (
                    <Link
                      href={user.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
                    >
                      <Github size={14} />
                      GitHub
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:flex-col sm:items-end">
              <LevelBadge level={user.level} size="lg" />
              <p className="text-sm text-text-secondary">{formatXP(user.xp)}</p>
              {isOwner && (
                <Link
                  href="/settings"
                  className="rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1.5 text-xs font-semibold text-accent-cyan"
                >
                  Edit profile
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Courses Completed</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{stats.coursesCompleted}</p>
          </article>
          <article className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Achievements Earned</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{stats.achievementsEarned}</p>
          </article>
          <article className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Current Streak</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{stats.currentStreak}d</p>
          </article>
          <article className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Global Rank</p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {stats.globalRank ? `#${stats.globalRank}` : '--'}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-text-primary">Skill Radar</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillData} outerRadius="70%">
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke="var(--color-accent-cyan)"
                  fill="var(--color-accent-cyan)"
                  fillOpacity={0.28}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-text-primary">Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {(['all', 'earned', 'locked'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setAchievementFilter(filter)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    achievementFilter === filter
                      ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                      : 'border-border text-text-secondary hover:text-text-primary',
                  )}
                >
                  {filter === 'all' ? 'All' : filter === 'earned' ? 'Earned' : 'Locked'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visibleAchievements.map((item) => (
              <div
                key={item.achievement.id}
                className={cn(!item.unlocked && 'opacity-40')}
              >
                <AchievementBadge
                  achievement={item.achievement}
                  unlocked={item.unlocked}
                  size="lg"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-text-primary">On-Chain Credentials</h2>
          {credentials.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {credentials.map((credential) => {
                const mappedCourse = courseBySlug.get(credential.course.slug);
                const trackName = mappedCourse ? formatTrack(mappedCourse.track) : 'General';
                return (
                  <article
                    key={credential.id}
                    className="rounded-xl border border-transparent bg-gradient-to-r from-accent-cyan/20 via-accent-purple/20 to-accent-green/20 p-[1px]"
                  >
                    <div className="rounded-[11px] bg-background p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary">
                          {credential.course.title}
                        </p>
                        <ShieldCheck className="text-accent-green" size={16} />
                      </div>
                      <p className="text-xs text-text-secondary">
                        Track: {trackName}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        Level: {user.level} • Courses completed: {stats.coursesCompleted}
                      </p>
                      <p className="mt-2 text-xs text-text-muted">
                        Mint: {truncateAddress(credential.mintAddress)}
                      </p>
                      <Link
                        href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-cyan hover:opacity-80"
                      >
                        Verify on Solana Explorer
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background px-4 py-8 text-center">
              <p className="text-sm text-text-secondary">
                No credentials yet. Complete courses to mint your first credential NFT.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold text-text-primary">Completed Courses</h2>
          {completedCourses.length > 0 ? (
            <ul className="space-y-3">
              {completedCourses.map((completed) => {
                const title = completed.courseSlug
                  ? (courseBySlug.get(completed.courseSlug)?.title ?? formatTrack(completed.courseSlug))
                  : completed.courseId;
                return (
                  <li
                    key={`${completed.courseId}-${completed.completedAt ?? completed.startedAt}`}
                    className="rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{title}</p>
                        <p className="text-xs text-text-muted">
                          Completed on{' '}
                          {completed.completedAt
                            ? new Date(completed.completedAt).toLocaleDateString()
                            : 'In progress'}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-xp">+{completed.xpEarned} XP</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-border bg-background px-4 py-8 text-center">
              <p className="text-sm text-text-secondary">
                No completed courses yet.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
