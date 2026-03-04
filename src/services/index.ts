import { LocalLearningProgressService } from './learning/LocalLearningProgressService';
import type { ILearningProgressService } from './learning/ILearningProgressService';
import { ContentService } from './content/ContentService';
import { UserProfileService } from './user/UserProfileService';

/**
 * Singleton learning-progress service.
 *
 * ─── Swapping to on-chain ──────────────────────────────────────────────────
 * Once the Anchor program is deployed, replace this one line:
 *
 *   // Before (Supabase):
 *   export const learningService: ILearningProgressService =
 *     new LocalLearningProgressService();
 *
 *   // After (on-chain):
 *   import { OnChainLearningProgressService } from './learning/OnChainLearningProgressService';
 *   export const learningService: ILearningProgressService =
 *     new OnChainLearningProgressService();
 *
 * Every consumer imports from `@/services` and calls the same interface —
 * zero changes required elsewhere in the app.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * @example
 * ```ts
 * import { learningService } from '@/services';
 *
 * const progress = await learningService.getProgress(userId, 'intro-to-solana');
 * const result   = await learningService.completeLesson(userId, lessonId, courseSlug);
 * ```
 */
export const learningService: ILearningProgressService =
  new LocalLearningProgressService();

/** Content fetches (Sanity-backed API routes). */
export const contentService = new ContentService();

/** User profile, stats, and preference management. */
export const userProfileService = new UserProfileService();

// ── Chain services (use directly when wallet context is available) ─────────────
// These are instantiated per-use rather than as singletons because they may
// need runtime config (e.g. wallet-adapter connection) injected at call time.
export { XPService } from './chain/XPService';
export { CredentialService } from './chain/CredentialService';
export { EnrollmentService } from './chain/EnrollmentService';

// ── Type re-exports for consumers ─────────────────────────────────────────────
export type { ILearningProgressService } from './learning/ILearningProgressService';
export type { LessonResult, LeaderboardTimeframe } from './learning/types';
export type {
  UserActivityItem,
  UserRankSummary,
  DailyXPActivity,
  UpdateProfileInput,
  UpdatePreferencesInput,
} from './user/UserProfileService';
