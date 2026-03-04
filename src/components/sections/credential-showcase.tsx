'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, BookOpen, Check, Link2 } from 'lucide-react';
import { LevelBadge } from '@/components/ui/level-badge';

// ─── NFT card mockup ──────────────────────────────────────────────────────────

function CredentialCard() {
  return (
    <motion.div
      className="relative w-full max-w-xs mx-auto"
      style={{ perspective: '1200px' }}
      whileHover={{ rotateY: 6, rotateX: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      {/* Glow behind the card */}
      <div
        className="absolute -inset-4 rounded-3xl blur-2xl opacity-40 -z-10"
        style={{
          background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)',
        }}
      />

      {/* Gradient border wrapper */}
      <div
        className="rounded-2xl p-[1.5px]"
        style={{
          background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #00D4FF 100%)',
        }}
      >
        <div className="rounded-2xl bg-surface p-6 flex flex-col gap-5">
          {/* Card header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-accent-cyan uppercase tracking-[0.15em]">
              Superteam Academy
            </span>
            <div className="flex items-center gap-1 text-[10px] text-accent-green font-medium">
              <Link2 size={9} />
              Solana
            </div>
          </div>

          {/* Profile area */}
          <div className="flex flex-col items-center gap-3 py-2">
            <LevelBadge level={15} size="lg" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-text-primary">
                Solana Developer
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Certified · Level 15</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen size={12} className="text-text-muted" />
              </div>
              <p className="text-base font-bold font-mono text-text-primary">12</p>
              <p className="text-[10px] text-text-muted">Courses</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={12} className="text-xp" />
              </div>
              <p className="text-base font-bold font-mono text-xp">8,450</p>
              <p className="text-[10px] text-text-muted">XP Total</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShieldCheck size={12} className="text-accent-green" />
              </div>
              <p className="text-base font-bold font-mono text-text-primary">42d</p>
              <p className="text-[10px] text-text-muted">Streak</p>
            </div>
          </div>

          {/* Verified badge */}
          <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20">
            <ShieldCheck size={13} className="text-accent-green" />
            <span className="text-xs font-semibold text-accent-green">
              Verified on Solana
            </span>
          </div>

          {/* Token ID */}
          <p className="text-center text-[10px] font-mono text-text-muted">
            #SOL-CRED-0x8F4A…3B2C
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Bullet point ─────────────────────────────────────────────────────────────

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-accent-green/15 border border-accent-green/30 shrink-0">
        <Check size={11} className="text-accent-green" />
      </div>
      <span className="text-text-secondary text-sm leading-relaxed">{children}</span>
    </li>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function CredentialShowcase() {
  return (
    <section className="py-24 px-6 bg-surface/50">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: NFT card */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            <CredentialCard />
          </motion.div>

          {/* Right: Copy */}
          <motion.div
            className="flex flex-col gap-8"
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-purple mb-3">
                On-Chain Identity
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight mb-4">
                Your Skills,{' '}
                <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                  On-Chain Forever
                </span>
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Every course you complete mints a soulbound NFT credential to your wallet.
                No middlemen. No paper certificates. Just cryptographic proof of your skills.
              </p>
            </div>

            <ul className="flex flex-col gap-4">
              <Bullet>
                <strong className="text-text-primary">Soulbound</strong> — permanently bound to your
                wallet. Can&apos;t be transferred, sold, or faked.
              </Bullet>
              <Bullet>
                <strong className="text-text-primary">Evolving</strong> — your credential updates as
                you complete more courses and level up on the platform.
              </Bullet>
              <Bullet>
                <strong className="text-text-primary">On-chain</strong> — verifiable by any employer,
                protocol, or DAO directly on the Solana blockchain.
              </Bullet>
            </ul>

            <Link
              href="/courses"
              className="self-start group flex items-center gap-2 px-6 py-3 rounded-xl border border-accent-purple/40 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 text-sm font-semibold transition-all duration-200"
            >
              Start Earning Credentials
              <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
