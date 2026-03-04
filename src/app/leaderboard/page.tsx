import type { Metadata } from 'next';
import { LeaderboardView } from '@/components/sections/leaderboard-view';
import { learningService } from '@/services';
import { getAllCourses } from '@/sanity/lib/queries';

export const metadata: Metadata = {
  title: 'Leaderboard | Superteam Academy',
  description: 'See the top Solana developers ranked by XP, streaks, and course progress.',
};

export default async function LeaderboardPage() {
  const [initialLeaderboard, courses] = await Promise.all([
    learningService.getLeaderboard('all').catch(() => []),
    getAllCourses().catch(() => []),
  ]);

  const courseFilterOptions = [
    { value: 'all', label: 'All Courses' },
    ...courses.map((course) => ({
      value: course.slug.current,
      label: course.title,
    })),
  ];

  return (
    <LeaderboardView
      initialLeaderboard={initialLeaderboard}
      courseFilterOptions={courseFilterOptions}
    />
  );
}
