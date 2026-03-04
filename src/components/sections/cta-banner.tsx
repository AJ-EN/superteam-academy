'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';

export function CTABanner() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Gradient top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #00D4FF, #8B5CF6, transparent)',
        }}
      />

      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full blur-[120px]"
          style={{ background: '#8B5CF6', opacity: 0.12 }}
          animate={{ scaleX: [1, 1.15, 1], scaleY: [1, 0.9, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] rounded-full blur-[80px]"
          style={{ background: '#00D4FF', opacity: 0.08 }}
          animate={{ scaleX: [1, 0.9, 1], scaleY: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="mx-auto max-w-3xl text-center flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      >
        {/* Social proof chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs text-text-secondary">
          <Users size={12} className="text-accent-green" />
          <span>
            <span className="font-semibold text-text-primary">2,847</span> developers already building
          </span>
        </div>

        <div>
          <h2 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-4">
            Ready to Build on{' '}
            <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
              Solana?
            </span>
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Join 2,847 developers learning the fastest growing blockchain ecosystem.
            Your first course is completely free.
          </p>
        </div>

        <Link
          href="/courses"
          className="group flex items-center gap-2.5 px-8 py-4 rounded-xl bg-accent-cyan text-background font-bold text-base hover:bg-accent-cyan/85 transition-all duration-200 shadow-xl shadow-accent-cyan/25"
        >
          Start Learning Free
          <ArrowRight
            size={18}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>

        <p className="text-xs text-text-muted">
          No credit card required · Free forever · Earn real on-chain credentials
        </p>
      </motion.div>
    </section>
  );
}
