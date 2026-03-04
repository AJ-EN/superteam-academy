'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// Wallet adapter base styles — must be imported once, here.
import '@solana/wallet-adapter-react-ui/styles.css';

// ─── Config ───────────────────────────────────────────────────────────────────

const NETWORK = WalletAdapterNetwork.Devnet;

/**
 * RPC endpoint. Falls back to the public devnet cluster.
 * Set NEXT_PUBLIC_SOLANA_RPC_URL to a private Helius endpoint in production.
 */
const ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(NETWORK);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps the app with Solana connection, wallet, and modal providers.
 *
 * Wallet support:
 * - Phantom, Solflare, Coinbase — explicitly registered adapters.
 * - Backpack and any other Wallet Standard–compliant wallet are detected
 *   automatically by the WalletProvider without needing an explicit adapter.
 *   See: https://github.com/wallet-standard/wallet-standard
 *
 * `autoConnect` re-connects the previously used wallet on page load using
 * the adapter name stored in localStorage (`walletName`).
 */
export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: NETWORK }),
      new CoinbaseWalletAdapter(),
      // Backpack implements the Wallet Standard — it is auto-discovered.
      // No explicit BackpackWalletAdapter needed for wallet-adapter v0.15+.
    ],
    [],
  );

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
