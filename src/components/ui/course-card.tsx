'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Zap, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@/types';

interface CourseCardProps {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  difficulty: Difficulty;
  xpReward: number;
  estimatedHours: number;
  slug: string;
  /** 0–100 completion percentage. */
  progress?: number;
  moduleCount?: number;
  tags?: string[];
  className?: string;
}

const difficultyConfig: Record<
  Difficulty,
  { label: string; className: string }
> = {
  beginner: {
    label: 'Beginner',
    className: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  },
  intermediate: {
    label: 'Intermediate',
    className: 'bg-xp/10 text-xp border-xp/20',
  },
  advanced: {
    label: 'Advanced',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
};

export function CourseCard({
  title,
  description,
  thumbnailUrl,
  difficulty,
  xpReward,
  estimatedHours,
  slug,
  progress,
  moduleCount,
  tags,
  className,
}: CourseCardProps) {
  const diff = difficultyConfig[difficulty];
  const hasProgress = typeof progress === 'number' && progress > 0;

  return (
    <motion.div
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-surface overflow-hidden',
        'hover:border-accent-purple/40 transition-colors duration-200',
        className,
      )}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-surface-2 overflow-hidden">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="text-border" size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/70 to-transparent" />

        {/* Difficulty badge */}
        <span
          className={cn(
            'absolute top-3 right-3 text-xs font-medium px-2.5 py-0.5 rounded-full border',
            diff.className,
          )}
        >
          {diff.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <h3 className="font-semibold text-text-primary line-clamp-2 leading-snug">
          {title}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-2 flex-1 leading-relaxed">
          {description}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-text-muted border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {hasProgress && (
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Progress</span>
              <span>{Math.round(progress!)}%</span>
            </div>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-purple transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {estimatedHours}h
            </span>
            {moduleCount !== undefined && (
              <span className="flex items-center gap-1">
                <BookOpen size={11} />
                {moduleCount}m
              </span>
            )}
            <span className="flex items-center gap-1 text-xp font-mono font-medium">
              <Zap size={11} />
              {xpReward.toLocaleString()}
            </span>
          </div>
          <Link
            href={`/courses/${slug}`}
            className="flex items-center gap-0.5 text-xs text-accent-cyan hover:text-accent-cyan/70 font-medium transition-colors"
          >
            {hasProgress ? 'Continue' : 'Start'}
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
