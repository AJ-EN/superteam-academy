import type { Achievement } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Service operation results
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rich result returned by completeLesson().
 * Captures every side-effect so UI can show level-up banners, streak toasts, etc.
 */
export interface LessonResult {
  lessonId: string;
  xpEarned: number;
  totalXp: number;
  streakUpdated: boolean;
  levelBefore: number;
  levelAfter: number;
  /** true when the learner crossed a level boundary. */
  levelUp: boolean;
  /** true when this was the final lesson in the course. */
  courseCompleted: boolean;
  /** true when a credential NFT was minted on-chain upon course completion. */
  credentialMinted: boolean;
  /** Solana transaction signature of the mint tx; null when credentialMinted is false. */
  credentialTxSignature: string | null;
  unlockedAchievements: Achievement[];
}

export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'all';

// ─────────────────────────────────────────────────────────────────────────────
// Helius DAS API shapes
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal shape of a DAS asset we actually consume. */
export interface DasAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      description: string;
      image?: string;
    };
    json_uri: string;
  };
  grouping: Array<{ group_key: string; group_value: string }>;
  ownership: { owner: string };
  mutable: boolean;
  burnt: boolean;
  /** ISO timestamp — only present on some RPC providers. */
  created_at?: string;
}

export interface DasGetAssetsByOwnerResponse {
  jsonrpc: '2.0';
  id: string;
  result: {
    items: DasAsset[];
    total: number;
    limit: number;
    page: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase row shapes (internal to service layer — never leave this directory)
// ─────────────────────────────────────────────────────────────────────────────

export interface SupabaseUserProfile {
  id: string;
  wallet_address: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseLessonProgress {
  user_id: string;
  lesson_id: string;
  course_id: string;
  status: string;
  xp_earned: number;
  completed_at: string | null;
  challenge_completed: boolean;
}

export interface SupabaseCourseProgress {
  user_id: string;
  course_id: string;
  course_slug: string;
  status: string;
  completed_lessons: number;
  total_lessons: number;
  xp_earned: number;
  started_at: string;
  completed_at: string | null;
}

export interface SupabaseStreakData {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  freezes_remaining: number;
  total_active_days: number;
}

export interface SupabaseLeaderboardRow {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  wallet_address: string;
  xp: number;
  level: number;
  streak: number;
  courses_completed: number;
}

export interface SupabaseCredentialRow {
  id: string;
  user_id: string;
  course_id: string;
  wallet_address: string;
  mint_address: string;
  tx_signature: string;
  metadata_uri: string;
  issued_at: string;
  network: string;
  courses: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string;
  };
}
