'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface UseSolanaReturn {
  /** Base58 public key string, or null when no wallet is connected. */
  walletAddress: string | null;
  /** True when a wallet is connected and its public key is available. */
  connected: boolean;
  /** True while a connection is being established. */
  connecting: boolean;
  /** SOL balance in SOL units (not lamports); null while loading or disconnected. */
  balance: number | null;
  /** True while the SOL balance is being fetched. */
  isLoadingBalance: boolean;
  /** Open the wallet selection modal. */
  connect: () => void;
  /** Disconnect the active wallet. */
  disconnect: () => Promise<void>;
  /** Re-fetch the SOL balance from the network. */
  refreshBalance: () => Promise<void>;
}

/**
 * Aggregates wallet connection state, SOL balance, and modal controls
 * into a single ergonomic hook.
 *
 * Must be used inside `<Providers>` (which includes `<SolanaProvider>`).
 *
 * @example
 * ```tsx
 * const { walletAddress, connected, balance, connect, disconnect } = useSolana();
 *
 * if (!connected) return <button onClick={connect}>Connect Wallet</button>;
 * return <span>{balance?.toFixed(4)} SOL</span>;
 * ```
 */
export function useSolana(): UseSolanaReturn {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    setIsLoadingBalance(true);
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed');
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [publicKey, connection]);

  // Fetch balance whenever the wallet or connection changes.
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Subscribe to account changes so balance stays live without polling.
  useEffect(() => {
    if (!publicKey) return;

    const id = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      },
      'confirmed',
    );

    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [publicKey, connection]);

  const connect = useCallback(() => setVisible(true), [setVisible]);

  return {
    walletAddress: publicKey?.toBase58() ?? null,
    connected,
    connecting,
    balance,
    isLoadingBalance,
    connect,
    disconnect,
    refreshBalance,
  };
}
