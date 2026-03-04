'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreakData } from '@/types';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  xp: number;
}

interface StreakCalendarProps {
  streakData: StreakData;
  activity?: DayActivity[];
  className?: string;
}

const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

function getXPColor(xp: number): string {
  if (xp <= 0) return 'var(--color-surface-2)';
  if (xp <= 50) return '#064E3B';
  if (xp <= 100) return '#065F46';
  return 'var(--color-accent-green)';
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

const LEGEND_COLORS = [
  'var(--color-surface-2)',
  '#064E3B',
  '#065F46',
  'var(--color-accent-green)',
];

export function StreakCalendar({
  streakData,
  activity = [],
  className,
}: StreakCalendarProps) {
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of activity) map.set(d.date, d.xp);
    return map;
  }, [activity]);

  // Build 12-week grid ending today (Mon-Sun orientation)
  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Align start to Monday
    const weekday = (today.getDay() + 6) % 7; // 0=Mon…6=Sun
    const start = new Date(today);
    start.setDate(today.getDate() - weekday - (WEEKS - 1) * 7);

    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: DAYS }, (__, d) => {
        const date = new Date(start);
        date.setDate(start.getDate() + w * DAYS + d);
        const key = toDateKey(date);
        const isFuture = date > today;
        return { date, key, xp: isFuture ? -1 : (activityMap.get(key) ?? 0) };
      }),
    );
  }, [activityMap]);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* Stats row */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-xp/10 border border-xp/20">
            <Flame className="text-xp" size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary font-mono leading-none">
              {streakData.currentStreak}
            </p>
            <p className="text-xs text-text-muted mt-0.5">current streak</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
            <Calendar className="text-accent-purple" size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary font-mono leading-none">
              {streakData.longestStreak}
            </p>
            <p className="text-xs text-text-muted mt-0.5">longest streak</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <div className="p-2 rounded-lg bg-accent-green/10 border border-accent-green/20">
            <Activity className="text-accent-green" size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary font-mono leading-none">
              {streakData.totalActiveDays}
            </p>
            <p className="text-xs text-text-muted mt-0.5">active days</p>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-1 mr-1 pt-0">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="h-3 w-7 flex items-center text-[10px] text-text-muted"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <motion.div
                  key={day.key}
                  className="h-3 w-3 rounded-sm cursor-default"
                  style={{
                    backgroundColor:
                      day.xp < 0
                        ? 'transparent'
                        : getXPColor(day.xp),
                    opacity: day.xp < 0 ? 0.2 : 1,
                  }}
                  title={day.xp >= 0 ? `${day.key}: ${day.xp} XP` : day.key}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: day.xp < 0 ? 0.2 : 1, scale: 1 }}
                  transition={{
                    delay: (wi * DAYS + di) * 0.002,
                    duration: 0.18,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>Less</span>
        {LEGEND_COLORS.map((color, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
