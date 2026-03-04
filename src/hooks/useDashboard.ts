'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAchievementProgress, type AchievementProgress } from '@/lib/achievements';
import { contentService, userProfileService, type DailyXPActivity, type UserActivityItem, type UserRankSummary } from '@/services';
import type { CourseProgress, StreakData, User } from '@/types';
import type { SanityCourseSummary } from '@/sanity/lib/queries';

export interface DashboardData {
  streakData: StreakData | null;
  courseProgress: CourseProgress[];
  rankSummary: UserRankSummary | null;
  dailyXPActivity: DailyXPActivity[];
  recentActivity: UserActivityItem[];
  allCourses: SanityCourseSummary[];
  featuredCourses: SanityCourseSummary[];
  achievements: AchievementProgress[];
}

export interface UseDashboardReturn extends DashboardData {
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const EMPTY_STREAK: StreakData = {
  userId: '',
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: new Date().toISOString().split('T')[0] ?? '',
  freezesRemaining: 0,
  totalActiveDays: 0,
};

export function useDashboard(user: User | null): UseDashboardReturn {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [rankSummary, setRankSummary] = useState<UserRankSummary | null>(null);
  const [dailyXPActivity, setDailyXPActivity] = useState<DailyXPActivity[]>([]);
  const [recentActivity, setRecentActivity] = useState<UserActivityItem[]>([]);
  const [allCourses, setAllCourses] = useState<SanityCourseSummary[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<SanityCourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const achievements = useMemo(() => {
    const completedCourses = courseProgress.filter((item) => item.status === 'completed').length;
    return getAchievementProgress({
      xp: user?.xp ?? 0,
      streak: streakData?.currentStreak ?? user?.streak ?? 0,
      coursesCompleted: completedCourses,
    });
  }, [courseProgress, streakData?.currentStreak, user?.streak, user?.xp]);

  const load = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const [
        streak,
        progress,
        rank,
        dailyActivity,
        activity,
        courses,
        featured,
      ] = await Promise.all([
        userProfileService.getStreakData(user.id).catch(() => ({
          ...EMPTY_STREAK,
          userId: user.id,
        })),
        userProfileService.getCourseProgress(user.id).catch(() => []),
        userProfileService.getGlobalRank(user.id).catch(() => ({
          rank: null,
          totalDevelopers: 0,
          percentile: null,
        })),
        userProfileService.getDailyXPActivity(user.id).catch(() => []),
        userProfileService.getRecentActivity(user).catch(() => []),
        contentService.getAllCourses().catch(() => []),
        contentService.getFeaturedCourses().catch(() => []),
      ]);

      setStreakData(streak);
      setCourseProgress(progress);
      setRankSummary(rank);
      setDailyXPActivity(dailyActivity);
      setRecentActivity(activity);
      setAllCourses(courses);
      setFeaturedCourses(featured);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError
          : new Error('Failed to load dashboard data.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [load, user]);

  return {
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
    refresh: load,
  };
}
