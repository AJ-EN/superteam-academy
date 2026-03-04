/**
 * Mock seed data for "Solana Fundamentals" — the platform's introductory course.
 *
 * Usage: Import and POST to the Sanity HTTP API with the service-role token,
 * or use the Sanity CLI:
 *
 *   npx sanity@latest dataset import seed/mockCourse.ndjson production
 *
 * To convert this file to NDJSON run:
 *   npx ts-node scripts/seedSanity.ts
 *
 * All `_id` values are stable so re-running the seed is idempotent.
 */

import type { SanityLesson, SanityModule, SanityCourse } from '../lib/queries';

// ─────────────────────────────────────────────────────────────────────────────
// Challenge lesson — "Send Your First SOL"
// ─────────────────────────────────────────────────────────────────────────────

export const sendSolChallenge = {
  _id: 'lesson-m3-l1',
  _type: 'lesson',
  title: 'Send Your First SOL',
  slug: { current: 'send-your-first-sol' },
  type: 'challenge' as const,
  xpReward: 50,
  order: 1,
  estimatedMinutes: 20,
  language: 'en',
  content: [
    {
      _type: 'block',
      _key: 'intro-block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text:
            "It's time to send real SOL on devnet! In this challenge you'll use `@solana/web3.js` to build, sign, and send a SOL transfer transaction. Every Solana transaction must be signed by the fee payer's private key before it can be included in a block.",
        },
      ],
    },
    {
      _type: 'callout',
      _key: 'devnet-callout',
      tone: 'info',
      text:
        'This challenge runs on Devnet. Use the Solana faucet to airdrop yourself SOL: `solana airdrop 2 <YOUR_PUBKEY> --url devnet`',
    },
  ],
  videoUrl: null,
  codeLanguage: 'typescript' as const,
  starterCode: `import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

// ── Setup ─────────────────────────────────────────────────────────────────────
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Load the sender keypair from the environment
// In production use: Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.PRIVATE_KEY!)))
const sender = Keypair.generate(); // replace with your funded keypair

// The recipient address
const recipient = new PublicKey('3p7GkiUSb8oDKSEUxSKGhcBMBNqpkeyPJCJFtjHTh9bW');

// Amount to send (0.01 SOL)
const amountInLamports = 0.01 * LAMPORTS_PER_SOL;

// ── TODO 1: Create the transfer instruction ───────────────────────────────────
// Use SystemProgram.transfer() to create a transfer instruction.
// Parameters: fromPubkey, toPubkey, lamports
const transferInstruction = /* YOUR CODE HERE */;

// ── TODO 2: Build the transaction ────────────────────────────────────────────
// Create a new Transaction and add the transfer instruction.
const transaction = /* YOUR CODE HERE */;

// ── TODO 3: Sign and send the transaction ─────────────────────────────────────
// Use sendAndConfirmTransaction() to sign, send, and confirm the transaction.
// Returns the transaction signature string.
async function main() {
  // Airdrop SOL to fund the sender (devnet only)
  const airdropSig = await connection.requestAirdrop(sender.publicKey, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig, 'confirmed');
  console.log('Funded sender:', sender.publicKey.toBase58());

  // TODO 3: Send the transaction
  const signature = /* YOUR CODE HERE */;

  console.log('Transaction signature:', signature);
  console.log(\`Explorer: https://explorer.solana.com/tx/\${signature}?cluster=devnet\`);
}

main().catch(console.error);
`,
  solutionCode: `import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const sender = Keypair.generate();
const recipient = new PublicKey('3p7GkiUSb8oDKSEUxSKGhcBMBNqpkeyPJCJFtjHTh9bW');
const amountInLamports = 0.01 * LAMPORTS_PER_SOL;

// ── Step 1: Create the transfer instruction ───────────────────────────────────
const transferInstruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: recipient,
  lamports: amountInLamports,
});

// ── Step 2: Build the transaction ────────────────────────────────────────────
const transaction = new Transaction().add(transferInstruction);

// ── Step 3: Sign and send ─────────────────────────────────────────────────────
async function main() {
  const airdropSig = await connection.requestAirdrop(sender.publicKey, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig, 'confirmed');
  console.log('Funded sender:', sender.publicKey.toBase58());

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [sender], // Signers array — sender pays the fee and authorises the transfer
  );

  console.log('Transaction signature:', signature);
  console.log(\`Explorer: https://explorer.solana.com/tx/\${signature}?cluster=devnet\`);
}

main().catch(console.error);
`,
  expectedPatterns: [
    'SystemProgram.transfer',
    'sendAndConfirmTransaction',
    'Transaction',
    'LAMPORTS_PER_SOL',
  ],
  hints: [
    '`SystemProgram.transfer({ fromPubkey, toPubkey, lamports })` creates a SOL transfer instruction. SOL amounts must be in lamports (1 SOL = 1,000,000,000 lamports).',
    'A `Transaction` object holds one or more instructions. Use `new Transaction().add(instruction)` to build it. Transactions must be signed before they can be submitted.',
    '`sendAndConfirmTransaction(connection, transaction, [signerKeypair])` signs, sends, and waits for confirmation in one call. It returns the transaction signature string.',
  ],
  testCases: [
    {
      _key: 'tc-1',
      description: 'Code uses SystemProgram.transfer to create the instruction',
      expectedOutput: 'SystemProgram.transfer',
    },
    {
      _key: 'tc-2',
      description: 'Transaction is submitted and confirmed on devnet',
      expectedOutput: 'tx:success',
    },
  ],
} satisfies Partial<SanityLesson> & { _type: string };

// ─────────────────────────────────────────────────────────────────────────────
// Content lessons
// ─────────────────────────────────────────────────────────────────────────────

const whatIsSolana = {
  _id: 'lesson-m1-l1',
  _type: 'lesson',
  title: 'What is Solana?',
  slug: { current: 'what-is-solana' },
  type: 'content' as const,
  xpReward: 25,
  order: 1,
  estimatedMinutes: 10,
  language: 'en',
  videoUrl: null,
  content: [
    {
      _type: 'block',
      _key: 'intro',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Solana is a high-performance Layer 1 blockchain designed for fast, cheap transactions at global scale. It achieves throughput of 65,000+ transactions per second through a combination of innovations that no other blockchain combines.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'poh-heading',
      style: 'h2',
      children: [{ _type: 'span', text: 'Proof of History (PoH)' }],
    },
    {
      _type: 'block',
      _key: 'poh-body',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Solana\'s breakthrough innovation is Proof of History — a cryptographic clock that creates a historical record proving that events occurred at a specific moment in time. This removes the need for validators to communicate to agree on time, dramatically reducing consensus overhead.',
        },
      ],
    },
    {
      _type: 'callout',
      _key: 'stats-callout',
      tone: 'tip',
      text: 'Key stats: ~400ms block times, ~$0.00025 average transaction fee, 65,000+ TPS theoretical throughput.',
    },
  ],
  starterCode: null,
  codeLanguage: null,
  solutionCode: null,
  expectedPatterns: null,
  hints: null,
  testCases: null,
};

const devEnvSetup = {
  _id: 'lesson-m1-l2',
  _type: 'lesson',
  title: 'Setting Up Your Development Environment',
  slug: { current: 'dev-environment-setup' },
  type: 'content' as const,
  xpReward: 25,
  order: 2,
  estimatedMinutes: 15,
  language: 'en',
  videoUrl: null,
  content: [
    {
      _type: 'block',
      _key: 'intro',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: "Let's get your machine ready to develop on Solana. You'll need the Solana CLI, Node.js, and a couple of global packages.",
        },
      ],
    },
    {
      _type: 'codeBlock',
      _key: 'install-cli',
      language: 'shell',
      filename: 'terminal',
      code: `# Install Solana CLI (macOS / Linux)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Verify
solana --version

# Configure for devnet
solana config set --url devnet

# Generate a keypair
solana-keygen new --outfile ~/.config/solana/devnet.json
solana config set --keypair ~/.config/solana/devnet.json

# Airdrop 2 SOL for testing
solana airdrop 2`,
    },
    {
      _type: 'codeBlock',
      _key: 'install-node',
      language: 'shell',
      filename: 'terminal',
      code: `# Install web3.js + Anchor dependencies
npm install @solana/web3.js @coral-xyz/anchor
npm install -D typescript ts-node @types/node`,
    },
  ],
  starterCode: null,
  codeLanguage: null,
  solutionCode: null,
  expectedPatterns: null,
  hints: null,
  testCases: null,
};

const accountModel = {
  _id: 'lesson-m2-l1',
  _type: 'lesson',
  title: 'Understanding the Solana Account Model',
  slug: { current: 'solana-account-model' },
  type: 'content' as const,
  xpReward: 25,
  order: 1,
  estimatedMinutes: 12,
  language: 'en',
  videoUrl: null,
  content: [
    {
      _type: 'block',
      _key: 'intro',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Everything on Solana is an account. Unlike Ethereum where contracts have their own storage, Solana separates code (programs) from data (accounts). This architecture is key to Solana\'s parallelism.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'anatomy-heading',
      style: 'h2',
      children: [{ _type: 'span', text: 'Anatomy of an Account' }],
    },
    {
      _type: 'codeBlock',
      _key: 'account-struct',
      language: 'rust',
      filename: 'solana_program/account_info.rs (simplified)',
      code: `pub struct Account {
    /// Lamports in the account (1 SOL = 1,000,000,000 lamports)
    pub lamports: u64,
    /// Data held in this account
    pub data: Vec<u8>,
    /// The program that owns this account (and can modify its data)
    pub owner: Pubkey,
    /// Is this account executable? (i.e. is it a program?)
    pub executable: bool,
    /// Epoch at which this account will next owe rent
    pub rent_epoch: Epoch,
}`,
    },
    {
      _type: 'callout',
      _key: 'rent-callout',
      tone: 'warning',
      text: 'Accounts must maintain a minimum lamport balance ("rent-exempt reserve") proportional to their data size, or they are garbage-collected. Use `connection.getMinimumBalanceForRentExemption(dataSize)` to calculate it.',
    },
  ],
  starterCode: null,
  codeLanguage: null,
  solutionCode: null,
  expectedPatterns: null,
  hints: null,
  testCases: null,
};

const programsVsContracts = {
  _id: 'lesson-m2-l2',
  _type: 'lesson',
  title: 'Programs vs Smart Contracts',
  slug: { current: 'programs-vs-smart-contracts' },
  type: 'content' as const,
  xpReward: 25,
  order: 2,
  estimatedMinutes: 10,
  language: 'en',
  videoUrl: null,
  content: [
    {
      _type: 'block',
      _key: 'intro',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Solana calls smart contracts "programs". Like EVM contracts, programs contain logic — but unlike EVM, Solana programs are stateless. All state lives in separate data accounts owned by the program.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'comparison-heading',
      style: 'h2',
      children: [{ _type: 'span', text: 'EVM vs Solana Architecture' }],
    },
    {
      _type: 'callout',
      _key: 'key-diff',
      tone: 'info',
      text: 'Key difference: In EVM, a contract owns its own storage. In Solana, a program can own many separate data accounts. This allows parallel execution — transactions touching different accounts can run simultaneously.',
    },
    {
      _type: 'codeBlock',
      _key: 'program-derived',
      language: 'typescript',
      filename: 'example.ts',
      code: `import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('YourProgramId...');

// Derive a Program Derived Address (PDA) — a deterministic account address
// that only the program can sign for.
const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('user-data'),      // seed 1: static string
    userWallet.toBuffer(),          // seed 2: user's public key
  ],
  PROGRAM_ID,
);

console.log('PDA:', pda.toBase58(), 'Bump:', bump);`,
    },
  ],
  starterCode: null,
  codeLanguage: null,
  solutionCode: null,
  expectedPatterns: null,
  hints: null,
  testCases: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Modules
// ─────────────────────────────────────────────────────────────────────────────

export const gettingStartedModule: Partial<SanityModule> & { _type: string } = {
  _id: 'module-1',
  _type: 'module',
  title: 'Getting Started',
  description:
    'Understand what Solana is, why it exists, and get your development environment ready.',
  order: 1,
  lessons: [whatIsSolana, devEnvSetup] as unknown as SanityModule['lessons'],
};

export const accountsProgramsModule: Partial<SanityModule> & { _type: string } = {
  _id: 'module-2',
  _type: 'module',
  title: 'Accounts & Programs',
  description:
    'Deep-dive into Solana\'s account model and learn how programs differ from EVM smart contracts.',
  order: 2,
  lessons: [accountModel, programsVsContracts] as unknown as SanityModule['lessons'],
};

export const firstTransactionModule: Partial<SanityModule> & { _type: string } = {
  _id: 'module-3',
  _type: 'module',
  title: 'Your First Transaction',
  description:
    'Put theory into practice by building and sending a real SOL transfer on devnet.',
  order: 3,
  lessons: [sendSolChallenge] as unknown as SanityModule['lessons'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Course
// ─────────────────────────────────────────────────────────────────────────────

export const solanaFundamentalsCourse: Partial<SanityCourse> & { _type: string } = {
  _id: 'course-solana-fundamentals',
  _type: 'course',
  title: 'Solana Fundamentals',
  slug: { current: 'solana-fundamentals' },
  description:
    'Go from zero to your first on-chain transaction. Learn Solana\'s architecture, account model, and programming paradigm — then prove your knowledge with a live devnet challenge.',
  thumbnail: null,
  difficulty: 'beginner',
  duration: 67, // sum of all estimatedMinutes
  xpReward: 500,
  track: 'fundamentals',
  language: 'en',
  order: 1,
  isPublished: true,
  modules: [
    gettingStartedModule,
    accountsProgramsModule,
    firstTransactionModule,
  ] as unknown as SanityCourse['modules'],
  prerequisites: null,
  moduleCount: 3,
  totalLessons: 5,
};

/** All documents needed for the seed, ordered for dependency-safe insertion. */
export const allSeedDocuments = [
  whatIsSolana,
  devEnvSetup,
  accountModel,
  programsVsContracts,
  sendSolChallenge,
  gettingStartedModule,
  accountsProgramsModule,
  firstTransactionModule,
  solanaFundamentalsCourse,
];
