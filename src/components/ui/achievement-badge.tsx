'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/types';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { outer: 'w-10 h-10', icon: 16, rounded: 'rounded-lg' },
  md: { outer: 'w-14 h-14', icon: 24, rounded: 'rounded-xl' },
  lg: { outer: 'w-20 h-20', icon: 32, rounded: 'rounded-2xl' },
} as const;

export function AchievementBadge({
  achievement,
  unlocked = false,
  size = 'md',
  showTooltip = true,
  className,
}: AchievementBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const s = sizeMap[size];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className={cn(
          'relative flex items-center justify-center border overflow-hidden cursor-pointer',
          s.outer,
          s.rounded,
          unlocked
            ? 'border-xp/40 bg-surface'
            : 'border-border bg-surface-2 opacity-50 grayscale',
          className,
        )}
        style={
          unlocked
            ? { boxShadow: '0 0 14px rgba(245,158,11,0.25)' }
            : undefined
        }
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {unlocked ? (
          <>
            <Image
              src={achievement.iconUrl}
              alt={achievement.title}
              width={s.icon}
              height={s.icon}
              className="object-contain"
            />
            {/* Unlock flash overlay */}
            <motion.div
              className={cn('absolute inset-0', s.rounded)}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.05 }}
              style={{
                background:
                  'radial-gradient(circle, rgba(245,158,11,0.7) 0%, transparent 70%)',
              }}
            />
          </>
        ) : (
          <Lock size={s.icon} className="text-text-muted" />
        )}
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && hovered && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-surface border border-border rounded-xl px-3 py-2.5 w-44 shadow-xl">
              <p className="font-semibold text-xs text-text-primary mb-0.5">
                {achievement.title}
              </p>
              <p className="text-xs text-text-secondary leading-snug">
                {achievement.description}
              </p>
              <p className="text-xp font-mono text-xs font-semibold mt-1.5">
                +{achievement.xpReward} XP
              </p>
              {!unlocked && (
                <p className="text-text-muted text-xs mt-1">
                  Locked
                </p>
              )}
            </div>
            {/* Arrow */}
            <div className="mx-auto w-2 h-2 bg-surface border-r border-b border-border rotate-45 -mt-1.5 translate-x-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
