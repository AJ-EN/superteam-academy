import { supabase } from '@/lib/supabase';
import { getAchievementProgress } from '@/lib/achievements';
import type { CourseProgress, StreakData, User } from '@/types';

export type ActivityType =
  | 'completed_lesson'
  | 'earned_achievement'
  | 'enrolled'
  | 'leveled_up';

export interface UserActivityItem {
  id: string;
  type: ActivityType;
  timestamp: string;
  courseSlug?: string;
  lessonId?: string;
  value?: number;
  label: string;
}

export interface DailyXPActivity {
  date: string;
  xp: number;
}

export interface UserRankSummary {
  rank: number | null;
  totalDevelopers: number;
  percentile: number | null;
}

export interface UpdateProfileInput {
  displayName: string;
  username: string;
  bio: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
}

export interface UpdatePreferencesInput {
  preferredLanguage: 'en' | 'pt-BR' | 'es';
  themePreference: 'dark' | 'light' | 'system';
  emailNotifications: boolean;
  profileVisibility: 'public' | 'private';
  showOnLeaderboard: boolean;
}

interface SupabaseUserProfileRow {
  id: string;
  wallet_address: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  twitter_url?: string | null;
  github_url?: string | null;
  preferred_language?: 'en' | 'pt-BR' | 'es' | null;
  theme_preference?: 'dark' | 'light' | 'system' | null;
  email_notifications?: boolean | null;
  profile_visibility?: 'public' | 'private' | null;
  show_on_leaderboard?: boolean | null;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

interface SupabaseCourseProgressRow {
  user_id: string;
  course_id: string;
  course_slug: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_lessons: number;
  total_lessons: number;
  xp_earned: number;
  started_at: string;
  completed_at: string | null;
}

interface SupabaseStreakRow {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  freezes_remaining: number;
  total_active_days: number;
}

interface SupabaseLeaderboardRow {
  user_id: string;
  xp: number;
}

interface SupabaseXPTransactionRow {
  id: string;
  reason: string;
  lesson_id: string | null;
  course_slug: string | null;
  amount: number;
  created_at: string;
}

export class UserProfileService {
  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle<SupabaseUserProfileRow>();

    if (error) {
      throw new Error(`UserProfileService.getUserByUsername: ${error.message}`);
    }

    return data ? mapUser(data) : null;
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<SupabaseUserProfileRow>();

    if (error) {
      throw new Error(`UserProfileService.getUserById: ${error.message}`);
    }

    return data ? mapUser(data) : null;
  }

  async getCourseProgress(userId: string): Promise<CourseProgress[]> {
    const { data, error } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .returns<SupabaseCourseProgressRow[]>();

    if (error) {
      throw new Error(`UserProfileService.getCourseProgress: ${error.message}`);
    }

    return data.map((row) => ({
      userId: row.user_id,
      courseId: row.course_id,
      courseSlug: row.course_slug,
      status: row.status,
      completedLessons: row.completed_lessons,
      totalLessons: row.total_lessons,
      xpEarned: row.xp_earned,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }));
  }

  async getStreakData(userId: string): Promise<StreakData> {
    const { data, error } = await supabase
      .from('streak_data')
      .select('*')
      .eq('user_id', userId)
      .single<SupabaseStreakRow>();

    if (error) {
      throw new Error(`UserProfileService.getStreakData: ${error.message}`);
    }

    return {
      userId: data.user_id,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastActivityDate: data.last_activity_date,
      freezesRemaining: data.freezes_remaining,
      totalActiveDays: data.total_active_days,
    };
  }

  async getGlobalRank(userId: string): Promise<UserRankSummary> {
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('user_id, xp')
      .order('xp', { ascending: false })
      .limit(500)
      .returns<SupabaseLeaderboardRow[]>();

    if (error) {
      throw new Error(`UserProfileService.getGlobalRank: ${error.message}`);
    }

    const totalDevelopers = data.length;
    if (totalDevelopers === 0) {
      return {
        rank: null,
        totalDevelopers: 0,
        percentile: null,
      };
    }

    const rank = data.findIndex((entry) => entry.user_id === userId) + 1;

    return {
      rank: rank === 0 ? null : rank,
      totalDevelopers,
      percentile:
        rank === 0
          ? null
          : Math.max(
              1,
              Math.round(((totalDevelopers - rank + 1) / totalDevelopers) * 100),
            ),
    };
  }

  async getDailyXPActivity(userId: string, days = 84): Promise<DailyXPActivity[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .returns<Array<{ amount: number; created_at: string }>>();

    if (error) {
      throw new Error(`UserProfileService.getDailyXPActivity: ${error.message}`);
    }

    const aggregate = new Map<string, number>();
    for (const row of data) {
      const key = row.created_at.split('T')[0] ?? row.created_at;
      aggregate.set(key, (aggregate.get(key) ?? 0) + row.amount);
    }

    return [...aggregate.entries()]
      .map(([date, xp]) => ({ date, xp }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getRecentActivity(user: User, limit = 12): Promise<UserActivityItem[]> {
    const [transactions, progress] = await Promise.all([
      this.getXPTransactions(user.id, Math.max(limit * 2, 18)),
      this.getCourseProgress(user.id).catch(() => []),
    ]);

    const activities: UserActivityItem[] = [];

    for (const tx of transactions) {
      if (tx.reason !== 'lesson_completed') continue;
      activities.push({
        id: `lesson-${tx.id}`,
        type: 'completed_lesson',
        timestamp: tx.created_at,
        courseSlug: tx.course_slug ?? undefined,
        lessonId: tx.lesson_id ?? undefined,
        value: tx.amount,
        label: tx.lesson_id
          ? `Completed ${tx.lesson_id}`
          : 'Completed a lesson',
      });
    }

    for (const record of progress.slice(0, 4)) {
      activities.push({
        id: `enrolled-${record.courseSlug ?? record.courseId}`,
        type: 'enrolled',
        timestamp: record.startedAt,
        courseSlug: record.courseSlug,
        label: `Enrolled in ${record.courseSlug ?? 'a course'}`,
      });
    }

    if (user.level > 0) {
      activities.push({
        id: `level-${user.level}`,
        type: 'leveled_up',
        timestamp: user.updatedAt,
        value: user.level,
        label: `Reached Level ${user.level}`,
      });
    }

    const completedCourses = progress.filter((item) => item.status === 'completed').length;
    const streakValue = user.streak;
    const achievementProgress = getAchievementProgress({
      xp: user.xp,
      streak: streakValue,
      coursesCompleted: completedCourses,
    });

    for (const unlocked of achievementProgress.filter((item) => item.unlocked).slice(-2)) {
      activities.push({
        id: `achievement-${unlocked.achievement.id}`,
        type: 'earned_achievement',
        timestamp: user.updatedAt,
        label: `Earned ${unlocked.achievement.title} badge`,
      });
    }

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    const updatePayload = {
      display_name: input.displayName,
      username: input.username,
      bio: input.bio,
      twitter_url: input.twitterUrl,
      github_url: input.githubUrl,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .single<SupabaseUserProfileRow>();

    if (error) {
      throw new Error(`UserProfileService.updateProfile: ${error.message}`);
    }

    return mapUser(data);
  }

  async updatePreferences(userId: string, input: UpdatePreferencesInput): Promise<User> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        preferred_language: input.preferredLanguage,
        theme_preference: input.themePreference,
        email_notifications: input.emailNotifications,
        profile_visibility: input.profileVisibility,
        show_on_leaderboard: input.showOnLeaderboard,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single<SupabaseUserProfileRow>();

    if (error) {
      throw new Error(`UserProfileService.updatePreferences: ${error.message}`);
    }

    return mapUser(data);
  }

  async clearProgress(userId: string): Promise<void> {
    const deleteTables = ['lesson_progress', 'course_progress', 'xp_transactions'] as const;

    for (const table of deleteTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);
      if (error) {
        throw new Error(`UserProfileService.clearProgress(${table}): ${error.message}`);
      }
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        xp: 0,
        level: 0,
        streak: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`UserProfileService.clearProgress(profile): ${profileError.message}`);
    }

    await supabase
      .from('streak_data')
      .update({
        current_streak: 0,
        longest_streak: 0,
        total_active_days: 0,
        last_activity_date: new Date().toISOString().split('T')[0],
      })
      .eq('user_id', userId);
  }

  private async getXPTransactions(
    userId: string,
    limit: number,
  ): Promise<SupabaseXPTransactionRow[]> {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('id, reason, lesson_id, course_slug, amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<SupabaseXPTransactionRow[]>();

    if (error) {
      throw new Error(`UserProfileService.getXPTransactions: ${error.message}`);
    }

    return data;
  }
}

function mapUser(row: SupabaseUserProfileRow): User {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    twitterUrl: row.twitter_url ?? null,
    githubUrl: row.github_url ?? null,
    preferredLanguage: row.preferred_language ?? undefined,
    themePreference: row.theme_preference ?? undefined,
    emailNotifications: row.email_notifications ?? undefined,
    profileVisibility: row.profile_visibility ?? undefined,
    showOnLeaderboard: row.show_on_leaderboard ?? undefined,
    xp: row.xp,
    level: row.level,
    streak: row.streak,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
