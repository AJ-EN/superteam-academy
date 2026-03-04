'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      'Finally a platform that teaches real Solana development, not just theory. I shipped my first program in week two.',
    author: '@cryptodev_br',
    role: 'Rust Developer',
    courses: 6,
    level: 12,
  },
  {
    quote:
      'Went from zero to deploying my first Anchor program in 2 weeks. The interactive challenges are genuinely different.',
    author: '@solana_builder',
    role: 'Web3 Engineer',
    courses: 4,
    level: 8,
  },
  {
    quote:
      'The on-chain credentials actually helped me get my first Web3 job. Employers could verify everything on-chain.',
    author: '@latam_dev',
    role: 'DeFi Developer',
    courses: 8,
    level: 18,
  },
];

const PARTNERS = [
  { name: 'Solana Foundation', accent: 'text-accent-green' },
  { name: 'Superteam', accent: 'text-accent-purple' },
  { name: 'Metaplex', accent: 'text-accent-cyan' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function SocialProof() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-green mb-3">
            Community
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Built by the Community
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.1 }}
              className="flex flex-col gap-5 p-6 rounded-2xl border border-border bg-surface hover:border-border/80 transition-colors"
            >
              {/* Quote icon */}
              <Quote size={24} className="text-accent-purple/40" />

              {/* Quote text */}
              <p className="text-sm text-text-secondary leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                {/* Avatar placeholder */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-xs font-bold text-background shrink-0">
                  {t.author.slice(1, 3).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {t.author}
                  </p>
                  <p className="text-xs text-text-muted">{t.role}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-mono font-bold text-xp">Lv {t.level}</p>
                  <p className="text-xs text-text-muted">{t.courses} courses</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partners */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-xs text-text-muted uppercase tracking-widest">
            Built with support from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {PARTNERS.map((p) => (
              <span
                key={p.name}
                className={`text-lg font-bold tracking-tight ${p.accent} opacity-60 hover:opacity-100 transition-opacity cursor-default`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
