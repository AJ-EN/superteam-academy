import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LEVEL_FORMULA } from './constants';

/** Merge Tailwind classes without conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an XP number for display.
 * @example formatXP(1250) → "1.3K XP"
 */
export function formatXP(xp: number): string {
  if (xp >= 1_000_000) {
    return `${(xp / 1_000_000).toFixed(1)}M XP`;
  }
  if (xp >= 1_000) {
    return `${(xp / 1_000).toFixed(1)}K XP`;
  }
  return `${xp} XP`;
}

/** Derive a user's level from their total XP. */
export function getLevelFromXP(xp: number): number {
  return LEVEL_FORMULA(xp);
}

/**
 * Returns the progress percentage (0–100) toward the next level.
 * Based on level formula: level = floor(sqrt(xp / 100))
 *   → XP threshold for level n = n² × 100
 */
export function getLevelProgress(xp: number): number {
  const level = getLevelFromXP(xp);
  const currentLevelXP = level * level * 100;
  const nextLevelXP = (level + 1) * (level + 1) * 100;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(Math.max(Math.round(progress * 10) / 10, 0), 100);
}

/**
 * Shorten a Solana wallet address for display.
 * @example truncateAddress("HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH") → "HN7c...YWrH"
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

const TIME_INTERVALS = [
  { label: 'year',   seconds: 31_536_000 },
  { label: 'month',  seconds: 2_592_000 },
  { label: 'week',   seconds: 604_800 },
  { label: 'day',    seconds: 86_400 },
  { label: 'hour',   seconds: 3_600 },
  { label: 'minute', seconds: 60 },
  { label: 'second', seconds: 1 },
] as const;

/**
 * Convert an ISO timestamp to a human-readable relative string.
 * @example timeAgo("2024-01-01T00:00:00Z") → "3 months ago"
 */
export function timeAgo(dateString: string): string {
  const elapsed = Math.floor((Date.now() - new Date(dateString).getTime()) / 1_000);

  for (const { label, seconds } of TIME_INTERVALS) {
    const count = Math.floor(elapsed / seconds);
    if (count >= 1) {
      return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}
