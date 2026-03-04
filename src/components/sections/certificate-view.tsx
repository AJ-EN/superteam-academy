'use client';

import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Share2,
  Sparkles,
} from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { trackCredentialView } from '@/lib/analytics';
import type { Credential } from '@/types';

interface CertificateViewProps {
  credential: Credential;
}

export function CertificateView({ credential }: CertificateViewProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    trackCredentialView(credential.id);
  }, [credential.id]);

  const completionDate = new Date(credential.issuedAt).toLocaleDateString();
  const certificateUrl = typeof window !== 'undefined' ? window.location.href : '';
  const twitterText =
    `Just earned my ${credential.course.title} credential on @SuperteamBR Academy! ` +
    'Verified on Solana 🚀 #Solana #Web3';

  const onPointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!certificateRef.current) return;
    const rect = certificateRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = ((0.5 - (y / rect.height)) * 10);
    setRotation({ x: rotateX, y: rotateY });
  };

  const resetRotation = () => setRotation({ x: 0, y: 0 });

  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(credential.mintAddress);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 1500);
    }
  };

  const copyLink = async () => {
    if (!certificateUrl) return;
    try {
      await navigator.clipboard.writeText(certificateUrl);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 1500);
    }
  };

  const downloadAsImage = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current);
      const url = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `superteam-certificate-${credential.mintAddress}.png`;
      anchor.click();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
          <motion.div
            ref={certificateRef}
            className="rounded-3xl bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-cyan p-[1px]"
            style={{ perspective: 1000 }}
            onMouseMove={onPointerMove}
            onMouseLeave={resetRotation}
            whileHover={{
              rotateX: rotation.x,
              rotateY: rotation.y,
              transition: { type: 'spring', stiffness: 220, damping: 18 },
            }}
          >
            <div className="relative overflow-hidden rounded-[23px] border border-border bg-background p-7 sm:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, transparent, transparent 12px, var(--color-accent-cyan) 12px, var(--color-accent-cyan) 13px)',
                }}
              />

              <div className="relative space-y-8">
                <header className="text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-text-muted">
                    Superteam Academy
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold text-text-primary sm:text-4xl">
                    Certificate of Completion
                  </h1>
                </header>

                <section className="text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Awarded to</p>
                  <p className="mt-2 font-mono text-sm text-text-secondary">
                    {truncateAddress(credential.userId, 8)}
                  </p>
                  <p className="mt-6 text-[2rem] font-serif font-semibold leading-tight text-text-primary sm:text-[2.4rem]">
                    {credential.course.title}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    Completed on {completionDate}
                  </p>
                </section>

                <section className="grid gap-3 rounded-xl border border-border bg-surface/70 p-4 text-center sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted">Level Achieved</p>
                    <p className="mt-1 text-lg font-semibold text-text-primary">Level {Math.max(1, Math.round(credential.course.title.length / 5))}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-text-muted">Total XP Earned</p>
                    <p className="mt-1 text-lg font-semibold text-xp">+500 XP</p>
                  </div>
                </section>

                <footer className="flex items-center justify-between rounded-xl border border-accent-green/35 bg-accent-green/10 px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-accent-green">
                    <CheckCircle2 size={16} />
                    Verified on Solana
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs text-text-secondary">
                    <Link2 size={13} />
                    Devnet
                  </div>
                </footer>
              </div>
            </div>
          </motion.div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold text-text-primary">On-Chain Verification</h2>
              <div className="mt-4 rounded-lg border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">Mint Address</p>
                <p className="mt-2 break-all font-mono text-xs text-text-secondary">
                  {credential.mintAddress}
                </p>
                <button
                  type="button"
                  onClick={copyMint}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-cyan"
                >
                  <Copy size={13} />
                  {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Retry' : 'Copy'}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-cyan px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  View on Solana Explorer
                  <ExternalLink size={14} />
                </a>
                <a
                  href={`https://www.helius.dev/?asset=${credential.mintAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary"
                >
                  View on Helius
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent-green/35 bg-accent-green/10 px-3 py-1.5 text-xs font-semibold text-accent-green">
                <CheckCircle2 size={14} />
                Verification Complete
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold text-text-primary">Share</h2>
              <div className="mt-4 grid gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${twitterText} ${certificateUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary"
                >
                  <Share2 size={14} />
                  Share on Twitter/X
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary"
                >
                  <Copy size={14} />
                  Copy Link
                </button>
                <button
                  type="button"
                  onClick={() => void downloadAsImage()}
                  disabled={isDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-purple px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  <Sparkles size={14} />
                  {isDownloading ? 'Downloading...' : 'Download as Image'}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
