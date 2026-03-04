import { supabase } from '@/lib/supabase';
import type {
  CourseProgress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
  ProgressStatus,
  SolanaNetwork,
} from '@/types';
import { getLevelFromXP } from '@/lib/utils';
import { XP_PER_LESSON } from '@/lib/constants';
import type { ILearningProgressService } from './ILearningProgressService';
import type {
  LessonResult,
  LeaderboardTimeframe,
  SupabaseCourseProgress,
  SupabaseStreakData,
  SupabaseLeaderboardRow,
  SupabaseCredentialRow,
} from './types';

/** localStorage key used as a fast-path to avoid duplicate streak DB writes. */
const STREAK_STORAGE_KEY = 'academy:last_activity_date';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Learning progress service backed by Supabase + localStorage.
 *
 * Every method includes a `TODO (ON-CHAIN)` comment that documents the exact
 * Solana transaction / account structure the on-chain version will use.
 * Swap this class for `OnChainLearningProgressService` in `src/services/index.ts`
 * after the Anchor program is deployed.
 */
export class LocalLearningProgressService implements ILearningProgressService {
  // ── getProgress ────────────────────────────────────────────────────────────

  /**
   * Fetch a learner's progress in a single course.
   *
   * @param userId - Learner's Supabase user ID.
   * @param courseSlug - Unique course slug.
   */
  async getProgress(userId: string, courseSlug: string): Promise<CourseProgress> {
    // TODO (ON-CHAIN):
    // 1. Derive EnrollmentAccount PDA:
    //      const [pda] = PublicKey.findProgramAddressSync(
    //        [Buffer.from('enrollment'), Buffer.from(courseSlug), new PublicKey(userId).toBuffer()],
    //        ACADEMY_PROGRAM_ID
    //      );
    //
    // 2. Fetch account data:
    //      const info = await connection.getAccountInfo(pda, 'confirmed');
    //      if (!info) throw new Error('Not enrolled');
    //
    // 3. Deserialize with Borsh (EnrollmentAccount struct):
    //      struct EnrollmentAccount {
    //        discriminator:      [u8; 8],        // Anchor account discriminator
    //        learner:            Pubkey,          // 32 bytes
    //        course_slug:        String,          // 4 + n bytes (Borsh)
    //        completed_lessons:  Vec<Pubkey>,     // 4 + 32n bytes (lesson PDAs)
    //        xp_earned:          u64,             // 8 bytes
    //        enrolled_at:        i64,             // 8 bytes (Unix timestamp)
    //        completed_at:       Option<i64>,     // 1 + 8 bytes
    //      }
    //
    // 4. Map to CourseProgress (total_lessons from course registry PDA).

    const { data, error } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_slug', courseSlug)
      .single<SupabaseCourseProgress>();

    if (error) {
      throw new Error(`getProgress: ${error.message}`);
    }

    return mapCourseProgress(data);
  }

  // ── completeLesson ─────────────────────────────────────────────────────────

  /**
   * Mark a lesson complete and apply all side-effects atomically.
   */
  async completeLesson(
    userId: string,
    lessonId: string,
    courseSlug: string,
  ): Promise<LessonResult> {
    // TODO (ON-CHAIN):
    // Build a single `CompleteLesson` instruction. All side-effects below
    // happen inside the Anchor program, atomically in one transaction.
    //
    // Instruction: CompleteLesson { lesson_id: String }
    //
    // Accounts:
    //   [signer, writable]  learner               — wallet paying tx fees
    //   [writable]          enrollment_pda         — EnrollmentAccount (progress)
    //   [writable]          xp_token_account       — learner's Token-2022 XP ATA
    //   []                  xp_mint                — soulbound XP Token-2022 mint
    //   []                  token_2022_program     — TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
    //   []                  lesson_registry_pda    — LessonAccount PDA (verifies lesson ∈ course)
    //   []                  academy_authority_pda  — PDA that has mint authority over xp_mint
    //   []                  associated_token_prog  — ATA program (for ATA init if needed)
    //   []                  system_program
    //
    // Program logic (Rust/Anchor pseudocode):
    //   1. Load lesson_registry_pda → verify lesson belongs to this course.
    //   2. Verify learner hasn't already completed this lesson.
    //   3. Push lesson_id to enrollment_pda.completed_lessons.
    //   4. CPI to Token-2022:
    //        mint_to(xp_token_account, lesson_registry_pda.xp_reward)
    //   5. Emit event: LessonCompleted { learner, course_slug, lesson_id, xp_earned }
    //   6. If enrollment_pda.completed_lessons.len() == course.total_lessons:
    //        enrollment_pda.completed_at = Clock::get()?.unix_timestamp
    //        Emit event: CourseCompleted { learner, course_slug }
    //        // Credential NFT is minted in a separate MintCredential instruction
    //        // triggered by the client after receiving the CourseCompleted event.
    //
    // Client-side flow:
    //   const tx = new Transaction().add(completeLessonIx);
    //   const sig = await sendTransaction(tx, connection);
    //   const result = await connection.confirmTransaction(sig, 'confirmed');
    //   // Parse emitted program events to build LessonResult.

    // ── Step 1: Load current XP to compute level delta ─────────────────────
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('xp, level')
      .eq('id', userId)
      .single<{ xp: number; level: number }>();

    if (profileErr) {
      throw new Error(`completeLesson: cannot fetch profile — ${profileErr.message}`);
    }

    const xpEarned = XP_PER_LESSON;
    const xpBefore = profile.xp;
    const xpAfter = xpBefore + xpEarned;
    const levelBefore = getLevelFromXP(xpBefore);
    const levelAfter = getLevelFromXP(xpAfter);

    // ── Step 2: Upsert lesson progress ─────────────────────────────────────
    const { error: lessonErr } = await supabase.from('lesson_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
        challenge_completed: false,
      },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: false },
    );

    if (lessonErr) {
      throw new Error(`completeLesson: lesson upsert — ${lessonErr.message}`);
    }

    // ── Step 3: Increment completed_lessons counter on course progress ──────
    // Using a Supabase RPC (Postgres function) for an atomic increment.
    //
    // SQL for the function:
    //   CREATE OR REPLACE FUNCTION increment_completed_lessons(
    //     p_user_id  uuid,
    //     p_course_slug text
    //   ) RETURNS void LANGUAGE sql AS $$
    //     UPDATE course_progress
    //       SET completed_lessons = completed_lessons + 1,
    //           xp_earned = xp_earned + 25
    //     WHERE user_id = p_user_id AND course_slug = p_course_slug;
    //   $$;
    const { error: rpcErr } = await supabase.rpc('increment_completed_lessons', {
      p_user_id: userId,
      p_course_slug: courseSlug,
    });

    if (rpcErr) {
      throw new Error(`completeLesson: course progress RPC — ${rpcErr.message}`);
    }

    // ── Step 4: Award XP on user profile ───────────────────────────────────
    const { error: xpErr } = await supabase
      .from('user_profiles')
      .update({ xp: xpAfter, level: levelAfter, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (xpErr) {
      throw new Error(`completeLesson: XP update — ${xpErr.message}`);
    }

    // ── Step 5: Log XP transaction (audit trail) ────────────────────────────
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount: xpEarned,
      reason: 'lesson_completed',
      lesson_id: lessonId,
      course_slug: courseSlug,
    });

    // ── Step 6: Update streak ───────────────────────────────────────────────
    const streakUpdated = await this._updateStreak(userId);

    // ── Step 7: Check achievement unlocks ──────────────────────────────────
    // TODO: Implement achievement rule engine.
    // Query achievement definitions, compare against new XP/streak/course totals,
    // and upsert newly unlocked AchievementReceipt rows.
    const unlockedAchievements: Achievement[] = [];

    // ── Step 8: Check course completion ────────────────────────────────────
    const { data: cp } = await supabase
      .from('course_progress')
      .select('completed_lessons, total_lessons')
      .eq('user_id', userId)
      .eq('course_slug', courseSlug)
      .single<{ completed_lessons: number; total_lessons: number }>();

    const courseCompleted = cp != null && cp.completed_lessons >= cp.total_lessons;

    if (courseCompleted) {
      await supabase
        .from('course_progress')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('course_slug', courseSlug);
    }

    // TODO (ON-CHAIN): If courseCompleted, send a MintCredential instruction:
    //   Accounts:
    //     [signer, writable]  learner
    //     [writable]          new_asset_pda       — Metaplex Core asset account
    //     []                  collection_pda      — Academy Core collection
    //     []                  mpl_core_program    — CoREENERqFMBT1dL3BfuYcMBVdMCGxmN4w...
    //     []                  academy_authority   — PDA that signs the mint
    //     []                  system_program
    //   The program verifies enrollment_pda.completed_at is set before minting.
    //   Returns: asset_address (credential mint) + tx_signature.

    return {
      lessonId,
      xpEarned,
      totalXp: xpAfter,
      streakUpdated,
      levelBefore,
      levelAfter,
      levelUp: levelAfter > levelBefore,
      courseCompleted,
      credentialMinted: false,   // always false in local mode
      credentialTxSignature: null,
      unlockedAchievements,
    };
  }

  // ── getXPBalance ───────────────────────────────────────────────────────────

  /**
   * Read XP balance from Supabase.
   *
   * @param walletAddress - Base58 wallet public key.
   */
  async getXPBalance(walletAddress: string): Promise<number> {
    // TODO (ON-CHAIN):
    // Delegate to XPService.getXPBalance():
    //   const xpService = new XPService();
    //   return xpService.getXPBalance(new PublicKey(walletAddress));
    //
    // This reads the Token-2022 soulbound token account directly from chain.
    // The Token-2022 NonTransferable extension guarantees the balance is accurate
    // (nobody can mint or burn without going through the academy program).

    const { data, error } = await supabase
      .from('user_profiles')
      .select('xp')
      .eq('wallet_address', walletAddress)
      .single<{ xp: number }>();

    if (error) {
      throw new Error(`getXPBalance: ${error.message}`);
    }

    return data.xp;
  }

  // ── getStreakData ──────────────────────────────────────────────────────────

  /**
   * Fetch streak and activity history for a learner.
   *
   * @param userId - Learner's user ID.
   */
  async getStreakData(userId: string): Promise<StreakData> {
    // TODO (ON-CHAIN):
    // Read StreakAccount PDA:
    //   const [pda] = PublicKey.findProgramAddressSync(
    //     [Buffer.from('streak'), new PublicKey(userId).toBuffer()],
    //     ACADEMY_PROGRAM_ID
    //   );
    //   const info = await connection.getAccountInfo(pda, 'confirmed');
    //
    // StreakAccount Borsh layout:
    //   struct StreakAccount {
    //     discriminator:        [u8; 8],
    //     learner:              Pubkey,   // 32 bytes
    //     current_streak:       u32,      // 4 bytes
    //     longest_streak:       u32,      // 4 bytes
    //     last_activity_unix:   i64,      // 8 bytes (UTC midnight as Unix timestamp)
    //     freezes_remaining:    u8,       // 1 byte
    //     total_active_days:    u32,      // 4 bytes
    //   }
    //
    // Streak-freeze tokens are a separate SPL token (streak_freeze_mint).
    // `freezes_remaining` is maintained by the program by reading the learner's
    // balance of that token at the time of a streak update instruction.

    const { data, error } = await supabase
      .from('streak_data')
      .select('*')
      .eq('user_id', userId)
      .single<SupabaseStreakData>();

    if (error) {
      throw new Error(`getStreakData: ${error.message}`);
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

  // ── getLeaderboard ─────────────────────────────────────────────────────────

  /**
   * Fetch the global leaderboard for the given timeframe.
   *
   * @param timeframe - `"weekly"` | `"monthly"` | `"all"`.
   */
  async getLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]> {
    // TODO (ON-CHAIN):
    // The leaderboard is NOT stored on-chain (iterating all program accounts is
    // expensive and non-deterministic). Instead:
    //
    // Option A — Helius webhooks (recommended):
    //   Configure a Helius webhook to fire on every `LessonCompleted` program event.
    //   A serverless function updates the `leaderboard_view` in Supabase incrementally.
    //   This gives sub-second leaderboard freshness with no chain polling.
    //   https://docs.helius.dev/webhooks-and-websockets/what-are-webhooks
    //
    // Option B — Clockwork scheduled thread:
    //   A Clockwork (now Ephemeris) cron job runs every N minutes, reads all
    //   StreakAccount + XP token balances via getProgramAccounts, computes ranks
    //   off-chain, and writes results to a Supabase leaderboard table.
    //
    // On-chain truth ✓ (Token-2022 XP is canonical), off-chain view ✓ (fast reads).

    const now = new Date();
    let fromDate: string | null = null;

    if (timeframe === 'weekly') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString();
    } else if (timeframe === 'monthly') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      fromDate = d.toISOString();
    }

    let query = supabase
      .from('leaderboard_view')
      .select('*')
      .order('xp', { ascending: false })
      .limit(100);

    if (fromDate !== null) {
      query = query.gte('updated_at', fromDate);
    }

    const { data, error } = await query.returns<SupabaseLeaderboardRow[]>();

    if (error) {
      throw new Error(`getLeaderboard: ${error.message}`);
    }

    return data.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      walletAddress: row.wallet_address,
      xp: row.xp,
      level: row.level,
      streak: row.streak,
      coursesCompleted: row.courses_completed,
    }));
  }

  // ── getCredentials ─────────────────────────────────────────────────────────

  /**
   * Fetch all academy credentials owned by a wallet.
   *
   * @param walletAddress - Base58 wallet public key.
   */
  async getCredentials(walletAddress: string): Promise<Credential[]> {
    // TODO (ON-CHAIN):
    // Delegate to CredentialService.getCredentials(walletAddress):
    //   const credService = new CredentialService();
    //   return credService.getCredentials(walletAddress);
    //
    // This uses the Helius DAS API to fetch Metaplex Core NFTs filtered by
    // ACADEMY_COLLECTION_ADDRESS, which is the canonical on-chain truth.
    // The Supabase `credentials` table is only kept as a cache / fallback.

    const { data, error } = await supabase
      .from('credentials')
      .select('*, courses(id, title, slug, thumbnail_url)')
      .eq('wallet_address', walletAddress)
      .returns<SupabaseCredentialRow[]>();

    if (error) {
      throw new Error(`getCredentials: ${error.message}`);
    }

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      course: {
        id: row.courses.id,
        title: row.courses.title,
        slug: row.courses.slug,
        thumbnailUrl: row.courses.thumbnail_url,
      },
      mintAddress: row.mint_address,
      txSignature: row.tx_signature,
      metadataUri: row.metadata_uri,
      issuedAt: row.issued_at,
      network: row.network as SolanaNetwork,
    }));
  }

  // ── enrollInCourse ─────────────────────────────────────────────────────────

  /**
   * Enrol a learner in a course (creates the progress record).
   *
   * @param userId - Learner's user ID.
   * @param courseSlug - Course to enrol in.
   */
  async enrollInCourse(userId: string, courseSlug: string): Promise<void> {
    // TODO (ON-CHAIN):
    // 1. Build + return unsigned EnrollInCourse transaction via EnrollmentService:
    //      const enrollSvc = new EnrollmentService();
    //      const tx = await enrollSvc.buildEnrollTransaction(
    //        new PublicKey(userId), courseSlug
    //      );
    //
    // 2. Client signs + sends (wallet-adapter):
    //      const sig = await sendTransaction(tx, connection);
    //      await connection.confirmTransaction(sig, 'confirmed');
    //
    // 3. After confirmation, a Helius webhook fires and mirrors the on-chain
    //    EnrollmentAccount into Supabase for fast reads.
    //
    // On-chain instruction accounts:
    //   [signer, writable]  learner
    //   [writable]          enrollment_pda  ← created by this ix (init)
    //   []                  course_registry_pda  ← verifies course exists + published
    //   []                  system_program
    //
    // Doing `enrollInCourse` as a Promise<void> means the on-chain version
    // would be split into buildEnrollTransaction() + confirmation callback.
    // This interface will need to be updated to return a Transaction when
    // migrating — noted here so the change is obvious at migration time.

    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, total_lessons')
      .eq('slug', courseSlug)
      .single<{ id: string; total_lessons: number }>();

    if (courseErr) {
      throw new Error(`enrollInCourse: course "${courseSlug}" not found — ${courseErr.message}`);
    }

    const { error } = await supabase.from('course_progress').upsert(
      {
        user_id: userId,
        course_id: course.id,
        course_slug: courseSlug,
        status: 'in_progress',
        completed_lessons: 0,
        total_lessons: course.total_lessons,
        xp_earned: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
      },
      { onConflict: 'user_id,course_slug', ignoreDuplicates: true },
    );

    if (error) {
      throw new Error(`enrollInCourse: upsert failed — ${error.message}`);
    }
  }

  // ── getCourseProgress ──────────────────────────────────────────────────────

  /**
   * Return progress across all enrolled courses for a learner.
   *
   * @param userId - Learner's user ID.
   */
  async getCourseProgress(userId: string): Promise<CourseProgress[]> {
    // TODO (ON-CHAIN):
    // Use getProgramAccounts with a memcmp filter on the learner Pubkey field:
    //   const accounts = await connection.getProgramAccounts(ACADEMY_PROGRAM_ID, {
    //     commitment: 'confirmed',
    //     filters: [
    //       { dataSize: ENROLLMENT_ACCOUNT_SIZE },        // filter by account type
    //       { memcmp: { offset: 8, bytes: userId } },     // offset 8 skips discriminator
    //     ],
    //   });
    //   return accounts.map(({ account }) => deserializeEnrollmentAccount(account.data));
    //
    // ENROLLMENT_ACCOUNT_SIZE must match the Borsh-encoded struct size.
    // For variable-length fields (course_slug, completed_lessons vec), use a
    // discriminator-only filter (offset 0, bytes = base58(discriminator)).

    const { data, error } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .returns<SupabaseCourseProgress[]>();

    if (error) {
      throw new Error(`getCourseProgress: ${error.message}`);
    }

    return data.map(mapCourseProgress);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Increment the learner's streak if they haven't already logged activity today.
   *
   * Uses localStorage as a fast-path to avoid a DB write when the same user
   * completes multiple lessons on the same day.
   *
   * @returns `true` if the streak counter was incremented.
   */
  private async _updateStreak(userId: string): Promise<boolean> {
    // TODO (ON-CHAIN):
    // Build an `UpdateStreak` instruction:
    //   Accounts:
    //     [signer]    learner
    //     [writable]  streak_pda
    //     []          clock sysvar (solana_program::sysvar::clock::ID)
    //
    // Program logic (Rust/Anchor pseudocode):
    //   let today_midnight = (Clock::get()?.unix_timestamp / 86_400) * 86_400;
    //   let diff_days = (today_midnight - streak_pda.last_activity_unix) / 86_400;
    //   match diff_days {
    //     0 => { /* already updated today — no-op */ }
    //     1 => { streak_pda.current_streak += 1; }
    //     2 if streak_pda.freezes_remaining > 0 => {
    //       // Consume one freeze token (burn via SPL token CPI)
    //       streak_pda.freezes_remaining -= 1;
    //     }
    //     _ => { streak_pda.current_streak = 1; } // broken streak — reset
    //   }
    //   streak_pda.longest_streak = max(streak_pda.current_streak, streak_pda.longest_streak);
    //   streak_pda.last_activity_unix = today_midnight;
    //   streak_pda.total_active_days += 1;

    const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD

    // Fast-path: skip DB round-trip if we already recorded activity today.
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STREAK_STORAGE_KEY);
      if (cached === today) return false;
    }

    const { data: streak, error: fetchErr } = await supabase
      .from('streak_data')
      .select('current_streak, longest_streak, last_activity_date, total_active_days')
      .eq('user_id', userId)
      .single<
        Pick<
          SupabaseStreakData,
          'current_streak' | 'longest_streak' | 'last_activity_date' | 'total_active_days'
        >
      >();

    if (fetchErr) return false;

    const lastDate = new Date(streak.last_activity_date);
    const todayDate = new Date(today);
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / 86_400_000,
    );

    if (diffDays === 0) return false;

    const newStreak = diffDays === 1 ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);

    await supabase
      .from('streak_data')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        total_active_days: streak.total_active_days + 1,
      })
      .eq('user_id', userId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STREAK_STORAGE_KEY, today);
    }

    return true;
  }
}

// ─── Pure mapping helpers ─────────────────────────────────────────────────────

function mapCourseProgress(row: SupabaseCourseProgress): CourseProgress {
  return {
    userId: row.user_id,
    courseId: row.course_id,
    courseSlug: row.course_slug,
    status: row.status as ProgressStatus,
    completedLessons: row.completed_lessons,
    totalLessons: row.total_lessons,
    xpEarned: row.xp_earned,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
