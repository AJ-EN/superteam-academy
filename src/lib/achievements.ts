import type { Achievement } from '@/types';

type AchievementMetric = 'xp' | 'streak' | 'courses';

interface AchievementDefinition extends Achievement {
  metric: AchievementMetric;
}

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'xp-100',
    title: 'First Sparks',
    description: 'Earn your first 100 XP.',
    iconUrl: '/badges/xp-100.svg',
    type: 'xp',
    requirement: 100,
    xpReward: 20,
    metric: 'xp',
  },
  {
    id: 'xp-1000',
    title: 'Chain Climber',
    description: 'Reach 1,000 XP total.',
    iconUrl: '/badges/xp-1000.svg',
    type: 'xp',
    requirement: 1000,
    xpReward: 80,
    metric: 'xp',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7 day streak.',
    iconUrl: '/badges/streak-7.svg',
    type: 'streak',
    requirement: 7,
    xpReward: 40,
    metric: 'streak',
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: 'Maintain a 30 day streak.',
    iconUrl: '/badges/streak-30.svg',
    type: 'streak',
    requirement: 30,
    xpReward: 120,
    metric: 'streak',
  },
  {
    id: 'courses-3',
    title: 'Pathfinder',
    description: 'Complete 3 courses.',
    iconUrl: '/badges/courses-3.svg',
    type: 'course',
    requirement: 3,
    xpReward: 90,
    metric: 'courses',
  },
  {
    id: 'courses-10',
    title: 'Master Builder',
    description: 'Complete 10 courses.',
    iconUrl: '/badges/courses-10.svg',
    type: 'course',
    requirement: 10,
    xpReward: 220,
    metric: 'courses',
  },
];

export function getAchievementProgress(input: {
  xp: number;
  streak: number;
  coursesCompleted: number;
}): AchievementProgress[] {
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const value = achievement.metric === 'xp'
      ? input.xp
      : achievement.metric === 'streak'
        ? input.streak
        : input.coursesCompleted;

    return {
      achievement,
      unlocked: value >= achievement.requirement,
    };
  });
}
