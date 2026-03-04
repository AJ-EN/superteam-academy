'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { XPService } from '@/services/chain/XPService';
import { getLevelFromXP, getLevelProgress } from '@/lib/utils';
import { AuthContext } from './AuthProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * An item in the XP animation queue.
 * Consumers (e.g. a floating "+25 XP" toast) dequeue items as they animate.
 */
export interface XPQueueItem {
  id: string;
  amount: number;
  timestamp: number;
}

export interface XPContextValue {
  /** Current XP total (may include unconfirmed optimistic adds). */
  xp: number;
  /** Derived level from current XP. */
  level: number;
  /** Percentage progress toward the next level (0–100). */
  levelProgress: number;
  /** True while the initial XP fetch from chain is in flight. */
  isLoading: boolean;
  /**
   * Items queued for XP gain animation.
   * Drain with `shiftQueue()` after each animation completes.
   */
  xpQueue: XPQueueItem[];
  /**
   * Re-fetch XP from chain (or Supabase in local mode).
   * Call after a lesson is completed to sync confirmed state.
   */
  refreshXP: () => Promise<void>;
  /**
   * Optimistically add XP to the local state and enqueue an animation item.
   * The actual on-chain mint happens in `completeLesson`; call this immediately
   * after the RPC call resolves to give instant feedback.
   */
  addXP: (amount: number) => void;
  /**
   * Remove the oldest item from the animation queue.
   * Call after the animation for that item finishes.
   */
  shiftQueue: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const XPContext = createContext<XPContextValue | null>(null);
export { XPContext };

const xpService = new XPService();

// ─── Provider ─────────────────────────────────────────────────────────────────

export function XPProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const { publicKey, connected } = useWallet();

  const [xp, setXP] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [xpQueue, setXPQueue] = useState<XPQueueItem[]>([]);

  // Stable ref for XP — avoids stale closure in addXP
  const xpRef = useRef(xp);
  xpRef.current = xp;

  const level = getLevelFromXP(xp);
  const levelProgress = getLevelProgress(xp);

  // ── Fetch XP from chain ───────────────────────────────────────────────────

  const refreshXP = useCallback(async () => {
    if (!connected || !publicKey) return;

    setIsLoading(true);
    try {
      const chainXP = await xpService.getXPBalance(publicKey);
      setXP(chainXP);
    } catch {
      // XP token account may not exist yet (new learner). Fall back to
      // Supabase value from user profile if the wallet hasn't earned XP on-chain.
      const profileXP = auth?.user?.xp ?? 0;
      setXP(profileXP);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, auth?.user?.xp]);

  // ── Seed XP from profile on auth, refresh from chain when wallet connects ─

  useEffect(() => {
    if (!connected || !publicKey) {
      // Seed from cached profile while wallet is connecting / before chain fetch
      setXP(auth?.user?.xp ?? 0);
      return;
    }
    // Wallet connected — fetch authoritative on-chain balance
    refreshXP();
  }, [connected, publicKey, auth?.user?.xp, refreshXP]);

  // ── Optimistic XP add ─────────────────────────────────────────────────────

  const addXP = useCallback((amount: number) => {
    if (amount <= 0) return;

    setXP((prev) => prev + amount);

    // Enqueue animation item
    const item: XPQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount,
      timestamp: Date.now(),
    };
    setXPQueue((prev) => [...prev, item]);
  }, []);

  // ── Drain the animation queue ─────────────────────────────────────────────

  const shiftQueue = useCallback(() => {
    setXPQueue((prev) => prev.slice(1));
  }, []);

  // ── Auto-expire stale queue items (safety net if consumer never drains) ───

  useEffect(() => {
    if (xpQueue.length === 0) return;

    const oldest = xpQueue[0];
    if (!oldest) return;

    const age = Date.now() - oldest.timestamp;
    const remaining = Math.max(0, 3_000 - age); // expire after 3 s

    const timer = setTimeout(() => {
      setXPQueue((prev) => prev.slice(1));
    }, remaining);

    return () => clearTimeout(timer);
  }, [xpQueue]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <XPContext.Provider
      value={{ xp, level, levelProgress, isLoading, xpQueue, refreshXP, addXP, shiftQueue }}
    >
      {children}
    </XPContext.Provider>
  );
}
