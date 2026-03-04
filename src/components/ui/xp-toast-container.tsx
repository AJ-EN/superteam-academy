'use client';

import { AnimatePresence } from 'framer-motion';
import { useXP } from '@/hooks/useXP';
import { XPToast } from './xp-toast';

/**
 * Fixed overlay that reads the XP animation queue and renders one toast at a time.
 * Place once in the root layout, inside <Providers>.
 */
export function XPToastContainer() {
  const { xpQueue, shiftQueue } = useXP();
  const current = xpQueue[0];

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none"
      aria-live="polite"
      aria-label="XP earned notifications"
    >
      <AnimatePresence mode="wait">
        {current && (
          <XPToast key={current.id} amount={current.amount} onExit={shiftQueue} />
        )}
      </AnimatePresence>
    </div>
  );
}
