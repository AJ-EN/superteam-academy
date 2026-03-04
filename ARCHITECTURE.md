# Architecture

## System Overview

```text
+---------------------------------------------+
|                   Browser                   |
+------------------+--------------------------+
                   |
+------------------v--------------------------+
|            Next.js 14 App Router            |
|         (Vercel Edge Network)               |
+--+-----------+--------------+---------------+
   |           |              |
+--v---+  +----v----+  +------v------+ 
|Sanity|  |Supabase |  | Solana RPC  |
| CMS  |  |  DB     |  |  Devnet     |
+------+  +---------+  +------+- -----+
                               |
                        +------v------+
                        | Helius DAS  |
                        |    API      |
                        +-------------+
```

## Service Layer Pattern

The service layer contract is the most important architectural decision in this project. UI and hooks depend on `ILearningProgressService`, not on a specific storage backend.

Source: `src/services/learning/ILearningProgressService.ts`

```typescript
import type {
  CourseProgress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from '@/types';
import type { LessonResult, LeaderboardTimeframe } from './types';

export interface ILearningProgressService {
  getProgress(userId: string, courseSlug: string): Promise<CourseProgress>;

  completeLesson(
    userId: string,
    lessonId: string,
    courseSlug: string,
  ): Promise<LessonResult>;

  getXPBalance(walletAddress: string): Promise<number>;
  getStreakData(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  enrollInCourse(userId: string, courseSlug: string): Promise<void>;
  getCourseProgress(userId: string): Promise<CourseProgress[]>;
}
```

Swap pattern (`src/services/index.ts`):

```typescript
// Current: Local implementation
const service: ILearningProgressService =
  new LocalLearningProgressService()

// Future: On-chain implementation
const service: ILearningProgressService =
  new OnChainLearningProgressService()
// Zero changes required in UI layer
```

## On-Chain Architecture

### XP Tokens (Token-2022)
XP is represented by a Token-2022 mint (`NEXT_PUBLIC_XP_TOKEN_MINT`) designed for soulbound semantics. The app reads XP balances from Token-2022 accounts using `getTokenAccountsByOwner` and parses the canonical amount field from account data.

Current balance read path (`src/services/chain/XPService.ts`):

```ts
const { value: tokenAccounts } =
  await connection.getTokenAccountsByOwner(wallet, {
    mint: mintPubkey,
    programId: TOKEN_2022_PROGRAM_ID,
  });
```

Minting TODO path (currently documented in service comments):
- Execute Token-2022 CPI mint during lesson completion on-chain.
- Keep mint authority under academy program control.
- Validate NonTransferable mint extension in production hardening.

### Credentials (Metaplex Core NFTs)
Credentials are represented as Metaplex Core assets and fetched via Helius DAS. The service supports both owner-based listing and single mint lookup. Collection filtering is controlled by `NEXT_PUBLIC_ACADEMY_COLLECTION_ADDRESS`.

Credential fetch path (`src/services/chain/CredentialService.ts`):

```ts
method: 'getAssetsByOwner' // list owner credentials
method: 'getAsset'         // resolve specific credential by mint
```

Design note:
- The codebase currently maps metadata into app `Credential` objects.
- Upgrade-in-place means metadata logic can evolve without replacing UI contracts because mapping is centralized in service helpers.

### Enrollment PDAs
Enrollment is modeled as an on-chain PDA keyed by learner + course slug.

Derivation (`src/services/chain/EnrollmentService.ts`):

```ts
PublicKey.findProgramAddressSync(
  [Buffer.from('enrollment'), Buffer.from(courseSlug, 'utf8'), learner.toBuffer()],
  ACADEMY_PROGRAM_ID,
)
```

Enrollment transaction flow:
1. Build unsigned tx in `EnrollmentService.buildEnrollTransaction()`.
2. Learner wallet signs and sends tx.
3. Confirm tx.
4. Index resulting state/events for fast UI reads.

### Stub Pattern
Real TODO comment from the codebase (`src/services/learning/LocalLearningProgressService.ts`):

```ts
// TODO (ON-CHAIN):
// Instruction: CompleteLesson { lesson_id: String }
// Accounts:
//   [signer, writable]  learner
//   [writable]          enrollment_pda
//   [writable]          xp_token_account
//   []                  xp_mint
//   []                  token_2022_program
//   []                  lesson_registry_pda
//   []                  academy_authority_pda
//   []                  associated_token_prog
//   []                  system_program
```

This pattern keeps migration intent explicit: instruction name, account metas, and side effects are documented where local logic currently runs.

## Data Flow Diagrams

### Content Flow

```text
Sanity CMS -> GROQ Query -> RSC -> UI
```

### Auth Flow

```text
Wallet Connect -> Supabase -> AuthProvider -> useAuth
```

### XP Flow

```text
Lesson Complete -> Service -> XPProvider
-> optimistic update -> animation queue -> toast
```

### Leaderboard Flow

```text
Helius DAS / indexed source -> aggregate XP -> sort -> display
```

## Component Hierarchy

```text
Providers (Theme/Solana/Auth/XP)
└── Layout (Navbar + Footer)
    └── Page (Server Component)
        └── Section (Client Component)
            └── UI Components
```

## State Management Strategy

- Server state: App Router Server Components + route-level fetch.
- Context state: React providers (`AuthProvider`, `XPProvider`, wallet providers).
- Local cache: TTL cache in `src/lib/cache.ts` used by hooks (`useCourse`, `useLeaderboard`).
- Persistent state: Supabase as backend source + localStorage fast-paths (e.g. streak/progress helpers).

## Performance Strategy

- Static generation for course-centric pages where possible (`generateStaticParams` / metadata precompute).
- Client-heavy libraries (Monaco, charting) isolated in client components and loaded only where needed.
- Custom TTL cache avoids extra SWR dependency and reduces repeated fetch costs.
- Deployed on Vercel for global edge delivery and low-latency static asset distribution.
