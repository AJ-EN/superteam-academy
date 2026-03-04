import type {
  CourseProgress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from '@/types';
import type { LessonResult, LeaderboardTimeframe } from './types';

/**
 * Contract for all learning-progress operations.
 *
 * Currently fulfilled by `LocalLearningProgressService` (Supabase + localStorage).
 * Swap the singleton in `src/services/index.ts` for `OnChainLearningProgressService`
 * once the Solana program is deployed — no other files need to change.
 */
export interface ILearningProgressService {
  /**
   * Fetch aggregate progress for a user in a specific course.
   *
   * @param userId - Internal user UUID (Supabase) / wallet pubkey (on-chain).
   * @param courseSlug - Unique course identifier (e.g. `"intro-to-solana"`).
   */
  getProgress(userId: string, courseSlug: string): Promise<CourseProgress>;

  /**
   * Mark a lesson complete, award XP, update streak, and check for course completion.
   *
   * Side-effects (all atomic on-chain; sequential in local mode):
   * - Upserts a lesson-progress record.
   * - Increments `completed_lessons` on the course-progress record.
   * - Mints XP tokens to the learner's soulbound Token-2022 account.
   * - Increments / resets the learner's streak.
   * - If all lessons are complete: mints a Metaplex Core credential NFT.
   * - Checks and unlocks any newly earned achievements.
   *
   * @param userId - Learner's user ID.
   * @param lessonId - The lesson being completed.
   * @param courseSlug - Parent course (needed to check completion).
   * @returns A `LessonResult` describing every side-effect triggered.
   */
  completeLesson(
    userId: string,
    lessonId: string,
    courseSlug: string,
  ): Promise<LessonResult>;

  /**
   * Read the XP balance for a wallet address.
   *
   * - Local mode: reads from `user_profiles.xp` in Supabase.
   * - On-chain mode: reads the Token-2022 soulbound token account balance.
   *
   * @param walletAddress - Base58 wallet public key.
   */
  getXPBalance(walletAddress: string): Promise<number>;

  /**
   * Fetch the current streak and historical activity data for a user.
   *
   * @param userId - Learner's user ID.
   */
  getStreakData(userId: string): Promise<StreakData>;

  /**
   * Fetch the global leaderboard, optionally filtered by timeframe.
   *
   * @param timeframe - `"weekly"` | `"monthly"` | `"all"` (all-time).
   */
  getLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;

  /**
   * Return all academy credentials (Metaplex Core NFTs) owned by a wallet.
   *
   * - Local mode: queries the `credentials` table in Supabase.
   * - On-chain mode: uses the Helius DAS API filtered by the academy collection.
   *
   * @param walletAddress - Base58 wallet public key of the owner.
   */
  getCredentials(walletAddress: string): Promise<Credential[]>;

  /**
   * Enrol a learner in a course.
   *
   * - Local mode: upserts a `course_progress` row in Supabase.
   * - On-chain mode: builds + sends an `EnrollInCourse` transaction that creates
   *   an `EnrollmentAccount` PDA on-chain (learner signs directly).
   *
   * @param userId - Learner's user ID.
   * @param courseSlug - Course to enrol in.
   */
  enrollInCourse(userId: string, courseSlug: string): Promise<void>;

  /**
   * Return progress across all enrolled courses for a learner.
   *
   * @param userId - Learner's user ID.
   */
  getCourseProgress(userId: string): Promise<CourseProgress[]>;
}
