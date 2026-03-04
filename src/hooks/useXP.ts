'use client';

import { useContext } from 'react';
import { XPContext } from '@/providers/XPProvider';
import type { XPContextValue } from '@/providers/XPProvider';

/**
 * Access XP state, level, and the animation queue.
 *
 * Must be used inside `<Providers>` (which includes `<XPProvider>`).
 *
 * @example
 * ```tsx
 * const { xp, level, levelProgress, addXP, xpQueue, shiftQueue } = useXP();
 *
 * // After completing a lesson:
 * const result = await learningService.completeLesson(userId, lessonId, courseSlug);
 * addXP(result.xpEarned); // optimistic UI update + triggers animation
 *
 * // In an XP toast component:
 * const item = xpQueue[0];
 * if (item) {
 *   // animate `+${item.amount} XP`, then:
 *   shiftQueue();
 * }
 * ```
 */
export function useXP(): XPContextValue {
  const ctx = useContext(XPContext);
  if (!ctx) {
    throw new Error(
      'useXP must be used inside <Providers>. ' +
        'Ensure src/app/layout.tsx wraps children with <Providers>.',
    );
  }
  return ctx;
}
