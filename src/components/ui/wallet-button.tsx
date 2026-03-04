'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, Copy, ExternalLink, LogOut, ChevronDown, Check } from 'lucide-react';
import { cn, truncateAddress } from '@/lib/utils';
import { trackWalletConnect } from '@/lib/analytics';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
  const t = useTranslations();
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const address = publicKey?.toBase58() ?? '';

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function viewOnExplorer() {
    window.open(
      `https://explorer.solana.com/address/${address}?cluster=devnet`,
      '_blank',
    );
    setOpen(false);
  }

  async function handleDisconnect() {
    await disconnect();
    setOpen(false);
  }

  if (!connected) {
    return (
      <button
        onClick={() => {
          trackWalletConnect(wallet?.adapter?.name ?? 'unknown');
          setVisible(true);
        }}
        disabled={connecting}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          'bg-accent-purple text-white hover:bg-accent-purple/80',
          'border border-accent-purple/50',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        )}
      >
        {connecting ? (
          <>
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            {t('common.loading')}
          </>
        ) : (
          <>
            <Wallet size={16} />
            {t('nav.connect')}
          </>
        )}
      </button>
    );
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-surface border border-border hover:border-accent-purple/40 text-text-primary"
      >
        <div className="w-2 h-2 rounded-full bg-accent-green" />
        <span className="font-mono text-xs">{truncateAddress(address)}</span>
        <ChevronDown
          size={14}
          className={cn(
            'text-text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-surface shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {/* Address header */}
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-xs text-text-muted">Connected wallet</p>
              <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">
                {address}
              </p>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-accent-green" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? 'Copied!' : 'Copy address'}
              </button>

              <button
                onClick={viewOnExplorer}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                <ExternalLink size={14} />
                View on Explorer
              </button>

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-surface-2 transition-colors"
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
