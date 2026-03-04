'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPToastProps {
  amount: number;
  onExit?: () => void;
  className?: string;
}

export function XPToast({ amount, onExit, className }: XPToastProps) {
  // Auto-dismiss after 2.5 s
  useEffect(() => {
    const timer = setTimeout(() => onExit?.(), 2500);
    return () => clearTimeout(timer);
  }, [onExit]);

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border',
        'bg-surface border-xp/30',
        className,
      )}
      style={{ boxShadow: '0 0 24px rgba(245,158,11,0.2), 0 4px 16px rgba(0,0,0,0.4)' }}
      initial={{ opacity: 0, y: 24, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <motion.div
        animate={{ rotate: [0, -18, 18, -8, 8, 0] }}
        transition={{ duration: 0.45, delay: 0.05 }}
      >
        <Zap size={16} className="text-xp" style={{ fill: 'var(--color-xp)' }} />
      </motion.div>
      <span className="text-sm font-bold text-xp font-mono">+{amount} XP</span>
    </motion.div>
  );
}
