'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface Tier {
  label: string;
  color: string;
  glowColor: string;
  rainbow?: boolean;
}

function getTier(level: number): Tier {
  if (level <= 5) {
    return { label: 'Bronze', color: '#CD7F32', glowColor: 'rgba(205,127,50,0.5)' };
  }
  if (level <= 10) {
    return { label: 'Silver', color: '#C0C0C0', glowColor: 'rgba(192,192,192,0.5)' };
  }
  if (level <= 20) {
    return { label: 'Gold', color: '#FFD700', glowColor: 'rgba(255,215,0,0.5)' };
  }
  return {
    label: 'Platinum',
    color: '#E5E4E2',
    glowColor: 'rgba(229,228,226,0.6)',
    rainbow: true,
  };
}

const sizeMap = {
  sm: { outer: 'w-8 h-8', text: 'text-xs', ring: '2px' },
  md: { outer: 'w-12 h-12', text: 'text-sm', ring: '2px' },
  lg: { outer: 'w-16 h-16', text: 'text-base', ring: '3px' },
} as const;

export function LevelBadge({
  level,
  animate = true,
  size = 'md',
  className,
}: LevelBadgeProps) {
  const tier = getTier(level);
  const s = sizeMap[size];

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-surface',
        s.outer,
        className,
      )}
      style={{
        border: `${s.ring} solid ${tier.color}`,
        boxShadow: `0 0 10px ${tier.glowColor}`,
      }}
      animate={
        animate
          ? {
              boxShadow: [
                `0 0 6px ${tier.glowColor}`,
                `0 0 16px ${tier.glowColor}`,
                `0 0 6px ${tier.glowColor}`,
              ],
            }
          : undefined
      }
      transition={
        animate
          ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          : undefined
      }
      title={`${tier.label} — Level ${level}`}
    >
      {tier.rainbow && (
        <div
          className="absolute inset-0 rounded-full opacity-20 animate-spin"
          style={{
            background:
              'conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff, #ff6b6b)',
            animationDuration: '4s',
          }}
        />
      )}
      <span
        className={cn('relative font-bold font-mono z-10', s.text)}
        style={{ color: tier.color }}
      >
        {level}
      </span>
    </motion.div>
  );
}
