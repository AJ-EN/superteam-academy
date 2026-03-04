import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { SOLANA_RPC_URL } from '@/lib/constants';

// ─── Environment ─────────────────────────────────────────────────────────────

/**
 * Deployed Anchor program ID.
 * Falls back to a valid placeholder so the app doesn't crash before
 * the program is deployed — enrollment will simply be a local DB operation.
 */
const FALLBACK_PROGRAM_ID = 'So11111111111111111111111111111111111111112';

const ACADEMY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ACADEMY_PROGRAM_ID ?? FALLBACK_PROGRAM_ID,
);

/**
 * Anchor instruction discriminator for `enroll_in_course`.
 * Computed as: sha256("global:enroll_in_course")[0..8]
 *
 * TODO (PROGRAM DEPLOYMENT): Regenerate from the actual deployed IDL:
 *   import idl from '@/idl/academy.json';
 *   const ix = idl.instructions.find(i => i.name === 'enrollInCourse')!;
 *   const discriminator = Buffer.from(ix.discriminator);
 *
 * Placeholder bytes — replace before going to production.
 */
const ENROLL_DISCRIMINATOR = Buffer.from([0xa8, 0x3f, 0x1c, 0x5e, 0x29, 0xd0, 0x7b, 0x11]);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds unsigned enrollment transactions for learners.
 *
 * The caller (React component via wallet-adapter) is responsible for signing
 * and sending the returned `Transaction` — the service never touches private keys.
 *
 * Architecture note:
 * The on-chain `enroll_in_course` instruction creates an `EnrollmentAccount` PDA
 * seeded by `["enrollment", courseSlug, learnerWallet]`. This PDA becomes the
 * source of truth for the learner's progress in that course.
 */
export class EnrollmentService {
  private readonly connection: Connection;

  constructor() {
    // TODO (MAINNET MIGRATION):
    // 1. Replace with a private mainnet Helius RPC URL.
    // 2. Consider a fee-sponsorship relayer (e.g. Octane) so learners don't
    //    need SOL to pay the enrollment fee:
    //    https://github.com/solana-labs/octane
    //    The relayer receives the unsigned tx, validates it, signs the fee-payer
    //    field, and forwards it — learner still signs their own accounts.
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }

  /**
   * Derive the `EnrollmentAccount` PDA for a (learner, course) pair.
   *
   * Seeds: `["enrollment", courseSlug_utf8, learnerWallet_bytes]`
   *
   * @param learner - The learner's wallet `PublicKey`.
   * @param courseSlug - Unique course identifier string.
   * @returns `[pda, bump]` tuple.
   */
  deriveEnrollmentPda(learner: PublicKey, courseSlug: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('enrollment'), Buffer.from(courseSlug, 'utf8'), learner.toBuffer()],
      ACADEMY_PROGRAM_ID,
    );
  }

  /**
   * Build an unsigned `EnrollInCourse` transaction ready for wallet signing.
   *
   * @param wallet - Learner's wallet `PublicKey` (signer + fee payer).
   * @param courseSlug - Unique identifier of the course to enrol in.
   * @returns Unsigned `Transaction` — pass to `sendTransaction` from wallet-adapter.
   *
   * @example
   * ```ts
   * // In a React component using @solana/wallet-adapter-react:
   * const { publicKey, sendTransaction } = useWallet();
   * const { connection } = useConnection();
   *
   * const tx = await enrollmentService.buildEnrollTransaction(publicKey, courseSlug);
   * const sig = await sendTransaction(tx, connection);
   * await connection.confirmTransaction(sig, 'confirmed');
   * ```
   */
  async buildEnrollTransaction(
    wallet: PublicKey,
    courseSlug: string,
  ): Promise<Transaction> {
    // TODO (PROGRAM DEPLOYMENT):
    // 1. Deploy the Anchor program to devnet.
    // 2. Set NEXT_PUBLIC_ACADEMY_PROGRAM_ID env var.
    // 3. Replace ENROLL_DISCRIMINATOR with the value from the generated IDL v2.
    // 4. Expand `keys` with all accounts listed in the IDL (e.g. course_registry_pda,
    //    clock sysvar, etc.).

    const [enrollmentPda] = this.deriveEnrollmentPda(wallet, courseSlug);

    // Borsh-encode courseSlug as a String: 4-byte LE length prefix + UTF-8 bytes.
    const slugBytes = Buffer.from(courseSlug, 'utf8');
    const slugLenBuf = Buffer.alloc(4);
    slugLenBuf.writeUInt32LE(slugBytes.length, 0);
    const data = Buffer.concat([ENROLL_DISCRIMINATOR, slugLenBuf, slugBytes]);

    // TODO (PROGRAM DEPLOYMENT): Replace with the full account meta list from IDL.
    const keys = [
      { pubkey: wallet,                  isSigner: true,  isWritable: true  }, // learner / fee-payer
      { pubkey: enrollmentPda,           isSigner: false, isWritable: true  }, // enrollment PDA (init)
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ];

    const enrollIx = new TransactionInstruction({
      programId: ACADEMY_PROGRAM_ID,
      keys,
      data,
    });

    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash('confirmed');

    const tx = new Transaction({ feePayer: wallet, blockhash, lastValidBlockHeight });
    tx.add(enrollIx);

    return tx;
  }

  /**
   * Check whether a learner is already enrolled in a course by verifying the
   * `EnrollmentAccount` PDA exists on-chain.
   *
   * @param wallet - The learner's wallet `PublicKey`.
   * @param courseSlug - The course to check.
   * @returns `true` if the enrollment PDA account exists.
   */
  async isEnrolled(wallet: PublicKey, courseSlug: string): Promise<boolean> {
    const [pda] = this.deriveEnrollmentPda(wallet, courseSlug);
    const info = await this.connection.getAccountInfo(pda);
    return info !== null;
  }
}
