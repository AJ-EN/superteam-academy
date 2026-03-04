import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_RPC_URL } from '@/lib/constants';

// ─── Token-2022 constants ─────────────────────────────────────────────────────

/** SPL Token-2022 program ID (Token Extensions). */
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
);

/**
 * Byte offset of the `amount` field in a base SPL token account.
 * Layout: mint(32) + owner(32) = 64 → amount u64 at offset 64.
 * Token-2022 shares the same base layout before extension data.
 */
const TOKEN_ACCOUNT_AMOUNT_OFFSET = 64;

// ─── Environment ─────────────────────────────────────────────────────────────

/** Mint address of the soulbound XP Token-2022 token. */
const XP_TOKEN_MINT = process.env.NEXT_PUBLIC_XP_TOKEN_MINT ?? '';

/**
 * Decimal places for the XP token.
 * Defaults to 0 — XP is always a whole number.
 */
const XP_TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_XP_TOKEN_DECIMALS ?? '0');

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads soulbound XP token balances from devnet via Token-2022.
 *
 * The XP token uses the `NonTransferable` extension, making it soulbound —
 * the academy program can mint XP to a learner, but the learner can never
 * transfer it to another wallet.
 */
export class XPService {
  private readonly connection: Connection;

  constructor() {
    // TODO (MAINNET MIGRATION):
    // Replace with a private Helius mainnet RPC for rate-limit protection:
    //   const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    //     ?? 'https://mainnet.helius-rpc.com/?api-key=<key>';
    // Also add RPC fallback logic (e.g. try/catch → secondary RPC) for resilience.
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }

  /**
   * Read the soulbound XP token balance for a learner wallet on devnet.
   *
   * Uses `getTokenAccountsByOwner` with the Token-2022 program, avoiding
   * a dependency on `@solana/spl-token` for this read-only operation.
   *
   * @param wallet - The learner's wallet `PublicKey`.
   * @returns XP balance as a whole number (scaled by `XP_TOKEN_DECIMALS`).
   *
   * @example
   * ```ts
   * const xp = await xpService.getXPBalance(new PublicKey(walletAddress));
   * console.log(`${xp} XP`);
   * ```
   */
  async getXPBalance(wallet: PublicKey): Promise<number> {
    if (!XP_TOKEN_MINT) {
      throw new Error(
        'XPService: NEXT_PUBLIC_XP_TOKEN_MINT is not configured. ' +
          'Deploy the academy program and set this env var.',
      );
    }

    // TODO (PRODUCTION):
    // Verify the mint still has the NonTransferable extension before reading:
    //   import { getMint, getExtensionData, ExtensionType } from '@solana/spl-token';
    //   const mintInfo = await getMint(
    //     this.connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID
    //   );
    //   const nonTransferable = getExtensionData(
    //     ExtensionType.NonTransferable, mintInfo.tlvData
    //   );
    //   if (!nonTransferable) throw new Error('XP mint is not soulbound — refusing to read');
    //
    // This guards against a compromised mint being substituted.
    // Requires: npm install @solana/spl-token

    const mintPubkey = new PublicKey(XP_TOKEN_MINT);

    const { value: tokenAccounts } =
      await this.connection.getTokenAccountsByOwner(wallet, {
        mint: mintPubkey,
        programId: TOKEN_2022_PROGRAM_ID,
      });

    if (tokenAccounts.length === 0) {
      // Learner has no XP token account — they haven't completed any lessons yet.
      return 0;
    }

    // Parse the u64 `amount` field from raw account data (little-endian, 8 bytes).
    // We use the first account — there should only ever be one ATA per mint per owner.
    const accountData = tokenAccounts[0].account.data;
    const rawAmount = accountData.readBigUInt64LE(TOKEN_ACCOUNT_AMOUNT_OFFSET);

    const divisor = BigInt(10 ** XP_TOKEN_DECIMALS);
    return Number(rawAmount / divisor);
  }
}
