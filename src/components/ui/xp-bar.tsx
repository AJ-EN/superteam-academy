'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface XPBarProps {
  xp: number;
  level: number;
  /** 0–100 percentage progress toward the next level (from useXP). */
  levelProgress: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const trackHeight = { sm: 'h-1', md: 'h-2', lg: 'h-3' } as const;

export function XPBar({
  xp,
  level,
  levelProgress,
  showLabel = true,
  size = 'md',
  className,
}: XPBarProps) {
  const pct = Math.min(Math.max(levelProgress, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span className="text-text-secondary font-medium">Level {level}</span>
          <span className="text-xp font-mono font-semibold">
            {xp.toLocaleString()} XP
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden bg-surface-2',
          trackHeight[size],
        )}
      >
        <motion.div
          className="h-full rounded-full bg-xp"
          style={{ boxShadow: '0 0 8px var(--color-xp)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end mt-1 text-xs text-text-muted">
          <span>{Math.round(pct)}% to Level {level + 1}</span>
        </div>
      )}
    </div>
  );
}
