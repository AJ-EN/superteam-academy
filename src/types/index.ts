// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'reading' | 'video' | 'quiz' | 'coding';
export type AchievementType = 'streak' | 'course' | 'lesson' | 'challenge' | 'xp' | 'special';

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  twitterUrl?: string | null;
  githubUrl?: string | null;
  preferredLanguage?: 'en' | 'pt-BR' | 'es';
  themePreference?: 'dark' | 'light' | 'system';
  emailNotifications?: boolean;
  profileVisibility?: 'public' | 'private';
  showOnLeaderboard?: boolean;
  xp: number;
  level: number;
  streak: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Content tree: Course → Module → Lesson → Challenge
// ─────────────────────────────────────────────────────────────────────────────

export interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
}

export interface Challenge {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  hints: string[];
  xpReward: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: LessonType;
  content: string; // MDX source
  xpReward: number;
  order: number;
  estimatedMinutes: number;
  challenge: Challenge | null;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  difficulty: Difficulty;
  tags: string[];
  modules: Module[];
  xpReward: number;
  estimatedHours: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────────────────────────────────

export interface LessonProgress {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  xpEarned: number;
  completedAt: string | null;
  challengeCompleted: boolean;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  courseSlug?: string;
  status: ProgressStatus;
  completedLessons: number;
  totalLessons: number;
  xpEarned: number;
  startedAt: string;
  completedAt: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  type: AchievementType;
  /** Numeric threshold that triggers this achievement (e.g. 7 for a 7-day streak). */
  requirement: number;
  xpReward: number;
}

export interface AchievementReceipt {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  unlockedAt: string;
  /** Solana transaction signature if the badge was minted on-chain; null otherwise. */
  txSignature: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string;
  xp: number;
  level: number;
  streak: number;
  coursesCompleted: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// On-chain credential (NFT)
// ─────────────────────────────────────────────────────────────────────────────

export interface Credential {
  id: string;
  userId: string;
  courseId: string;
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnailUrl'>;
  mintAddress: string;
  txSignature: string;
  metadataUri: string; // IPFS / Arweave URI pointing to the NFT metadata JSON
  issuedAt: string;
  network: SolanaNetwork;
}

// ─────────────────────────────────────────────────────────────────────────────
// Streak
// ─────────────────────────────────────────────────────────────────────────────

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  /** ISO date string (YYYY-MM-DD) of the most recent learning activity. */
  lastActivityDate: string;
  /** Number of streak-freeze tokens remaining. */
  freezesRemaining: number;
  totalActiveDays: number;
}
