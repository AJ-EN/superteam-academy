'use client';

import { useTranslations } from 'next-intl';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Trophy, Users, BookOpen, Award, ChevronDown } from 'lucide-react';
import { IntlLink } from '@/i18n/navigation';

// ─── Animation variants ────────────────────────────────────────────────────────

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-accent-cyan" />
      <span className="font-bold text-text-primary tabular-nums">{value}</span>
      <span className="text-text-muted">{label}</span>
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  const t = useTranslations();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* ── Animated gradient mesh ─────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Purple blob — top-left */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: '#8B5CF6', opacity: 0.22 }}
          animate={{ x: [0, 50, -20, 0], y: [0, -40, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Cyan blob — top-right */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-[480px] h-[480px] rounded-full blur-[120px]"
          style={{ background: '#00D4FF', opacity: 0.15 }}
          animate={{ x: [0, -40, 20, 0], y: [0, 50, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        {/* Purple blob — bottom-center */}
        <motion.div
          className="absolute bottom-1/4 left-1/2 w-[360px] h-[360px] rounded-full blur-[100px]"
          style={{ background: '#8B5CF6', opacity: 0.18 }}
          animate={{ x: [0, 30, -30, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* ── Dot-grid overlay ────────────────────────────────────────── */}
      <div
        className="absolute inset-0 -z-10"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(241,245,249,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Content ────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-8 pt-20"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow chip */}
        <motion.div variants={item}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 text-xs font-medium text-accent-cyan">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            Now live on Devnet — Mainnet launching Q3 2025
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
        >
          <span className="block text-text-primary">{t('hero.headline1')}</span>
          <span className="block mt-3">
            <span className="bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-cyan bg-clip-text text-transparent">
              {t('hero.headline2')}
            </span>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={item}
          className="max-w-2xl text-lg sm:text-xl text-text-secondary leading-relaxed"
        >
          {t('hero.subheadline')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <IntlLink
            href="/courses"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent-cyan text-background font-semibold text-sm hover:bg-accent-cyan/85 transition-all duration-200 shadow-lg shadow-accent-cyan/25"
          >
            {t('hero.cta_primary')}
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </IntlLink>
          <IntlLink
            href="/leaderboard"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent-purple/40 font-medium text-sm transition-all duration-200 bg-surface/50 backdrop-blur-sm"
          >
            <Trophy size={16} />
            {t('hero.cta_secondary')}
          </IntlLink>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          variants={item}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm pt-2"
        >
          <StatItem icon={Users} value="2,847" label="Developers" />
          <div className="hidden sm:block w-px h-4 bg-border" />
          <StatItem icon={BookOpen} value="12" label="Courses" />
          <div className="hidden sm:block w-px h-4 bg-border" />
          <StatItem icon={Award} value="1,204" label="Credentials Issued" />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <ChevronDown size={22} className="text-text-muted" />
      </motion.div>
    </section>
  );
}
