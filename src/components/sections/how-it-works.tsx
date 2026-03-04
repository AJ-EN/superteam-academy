'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Data ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    emoji: '🎯',
    title: 'Choose a Course',
    description:
      'Browse courses from Solana fundamentals to advanced DeFi protocols. Each one built by expert builders.',
    accentClass: 'border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan',
  },
  {
    number: '02',
    emoji: '💻',
    title: 'Learn & Build',
    description:
      'Interactive lessons with a real code editor. Write Rust and TypeScript directly in the browser — no setup.',
    accentClass: 'border-accent-purple/30 bg-accent-purple/5 text-accent-purple',
  },
  {
    number: '03',
    emoji: '⚡',
    title: 'Earn XP',
    description:
      'Complete challenges to earn on-chain XP tokens. Level up and climb the leaderboard against the community.',
    accentClass: 'border-xp/30 bg-xp/5 text-xp',
  },
  {
    number: '04',
    emoji: '🏆',
    title: 'Get Credentialed',
    description:
      'Receive soulbound NFT credentials that evolve as you progress. Verifiable by anyone, on-chain forever.',
    accentClass: 'border-accent-green/30 bg-accent-green/5 text-accent-green',
  },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-cyan mb-3">
            The Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            How It Works
          </h2>
        </div>

        {/* Steps — horizontal on desktop, vertical on mobile */}
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-0">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex flex-row md:flex-col flex-1 items-start gap-4 md:gap-0">
              {/* Step card */}
              <motion.div
                className="flex flex-col gap-4 md:pr-6 flex-1"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.12 }}
              >
                {/* Number badge + connector line (desktop) */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border font-bold text-sm font-mono shrink-0',
                      step.accentClass,
                    )}
                  >
                    {step.number}
                  </div>
                  {/* Horizontal connector line — visible on desktop between steps */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:flex items-center flex-1">
                      <div className="flex-1 h-px border-t border-dashed border-border" />
                      <ChevronRight size={14} className="text-border shrink-0 -ml-px" />
                    </div>
                  )}
                </div>

                {/* Emoji */}
                <div className="text-3xl">{step.emoji}</div>

                {/* Text */}
                <div className="md:pr-4">
                  <h3 className="text-base font-bold text-text-primary mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>

              {/* Vertical connector — mobile only */}
              {i < STEPS.length - 1 && (
                <div className="md:hidden flex flex-col items-center self-stretch pt-1 pl-4">
                  <div className="flex-1 w-px border-l border-dashed border-border min-h-8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
