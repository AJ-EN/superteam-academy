'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Data ──────────────────────────────────────────────────────────────────────

interface Path {
  id: string;
  emoji: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  courses: number;
  xp: number;
  href: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentGlow: string;
  difficultyClass: string;
}

const PATHS: Path[] = [
  {
    id: 'fundamentals',
    emoji: '🏗️',
    title: 'Solana Fundamentals',
    description: 'Master accounts, programs, and transactions from the ground up.',
    difficulty: 'Beginner',
    courses: 8,
    xp: 4000,
    href: '/courses?track=fundamentals',
    accentText: 'text-accent-cyan',
    accentBg: 'bg-accent-cyan/10',
    accentBorder: 'border-accent-cyan/20',
    accentGlow: 'rgba(0,212,255,0.25)',
    difficultyClass: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  },
  {
    id: 'defi',
    emoji: '🏦',
    title: 'DeFi Developer',
    description: 'Build DEXes, lending protocols, and yield vaults using Anchor.',
    difficulty: 'Intermediate',
    courses: 6,
    xp: 8000,
    href: '/courses?track=defi',
    accentText: 'text-accent-purple',
    accentBg: 'bg-accent-purple/10',
    accentBorder: 'border-accent-purple/20',
    accentGlow: 'rgba(139,92,246,0.25)',
    difficultyClass: 'bg-xp/10 text-xp border-xp/20',
  },
  {
    id: 'security',
    emoji: '🔒',
    title: 'Security & Auditing',
    description: 'Find vulnerabilities, write secure programs, audit real protocols.',
    difficulty: 'Advanced',
    courses: 4,
    xp: 12000,
    href: '/courses?track=security',
    accentText: 'text-red-400',
    accentBg: 'bg-red-400/10',
    accentBorder: 'border-red-400/20',
    accentGlow: 'rgba(239,68,68,0.25)',
    difficultyClass: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  {
    id: 'full-stack',
    emoji: '🖥️',
    title: 'Full Stack Solana',
    description: 'Frontend to on-chain — complete dApp development end-to-end.',
    difficulty: 'Intermediate',
    courses: 5,
    xp: 10000,
    href: '/courses?track=full-stack',
    accentText: 'text-accent-green',
    accentBg: 'bg-accent-green/10',
    accentBorder: 'border-accent-green/20',
    accentGlow: 'rgba(16,185,129,0.25)',
    difficultyClass: 'bg-xp/10 text-xp border-xp/20',
  },
];

// (animations applied inline per-card with whileInView + index-based delay)

// ─── Component ─────────────────────────────────────────────────────────────────

export function LearningPaths() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-purple mb-3">
            Structured Learning
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Choose Your Path
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PATHS.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{
                y: -4,
                boxShadow: `0 0 40px ${path.accentGlow}`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
              className={cn(
                'group relative flex flex-col gap-5 p-6 rounded-2xl border bg-surface',
                'transition-colors duration-300',
                path.accentBorder,
              )}
            >
              {/* Icon + title */}
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex items-center justify-center w-14 h-14 rounded-xl text-2xl shrink-0',
                    path.accentBg,
                  )}
                >
                  {path.emoji}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">
                    {path.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {path.description}
                  </p>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={cn(
                    'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                    path.difficultyClass,
                  )}
                >
                  {path.difficulty}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <BookOpen size={12} />
                  {path.courses} courses
                </span>
                <span className={cn('flex items-center gap-1 text-xs font-mono font-semibold', path.accentText)}>
                  <Zap size={12} />
                  {path.xp.toLocaleString()} XP
                </span>
              </div>

              {/* CTA */}
              <Link
                href={path.href}
                className={cn(
                  'self-start flex items-center gap-1.5 text-sm font-semibold transition-colors',
                  path.accentText,
                  'hover:opacity-80',
                )}
              >
                Explore Path
                <ArrowRight
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
