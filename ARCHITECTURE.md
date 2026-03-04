# Architecture

## System Overview

```text
┌────────────────────────────┐
│          Browser           │
│  (Next.js Client + Wallet) │
└─────────────┬──────────────┘
              │ HTTPS / RPC
              ▼
┌────────────────────────────────────────────┐
│            Next.js App Router              │
│  - Server Components / Route Handlers      │
│  - Client Components / Hooks / Providers   │
└───────┬─────────────────┬──────────────────┘
        │                 │
        │                 ├──────────────────────┐
        ▼                 ▼                      ▼
┌──────────────┐   ┌──────────────┐      ┌───────────────┐
│  Sanity CMS  │   │   Supabase   │      │   Solana RPC  │
│ (course data)│   │user/progress │      │   + Programs  │
└──────────────┘   └──────────────┘      └───────────────┘
        │
        └───────────────┐
                        ▼
                 ┌──────────────┐
                 │ Helius DAS   │
                 │ NFT asset API│
                 └──────────────┘

Observability
Next.js App ─────────────► PostHog (product analytics)
Next.js App ─────────────► Sentry  (errors + performance)
```

## Service Layer Architecture

The app uses an interface-first service layer so feature code does not depend on a specific storage backend.

- Contract: `src/services/learning/ILearningProgressService.ts`
- Current implementation: `LocalLearningProgressService` (Supabase/local)
- Future implementation: `OnChainLearningProgressService` (Anchor + Solana state)
- Singleton wiring: `src/services/index.ts`

### ILearningProgressService Contract (example)

```ts
export interface ILearningProgressService {
  getProgress(userId: string, courseSlug: string): Promise<CourseProgress>;
  completeLesson(userId: string, lessonId: string, courseSlug: string): Promise<LessonResult>;
  getXPBalance(walletAddress: string): Promise<number>;
  getStreakData(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  enrollInCourse(userId: string, courseSlug: string): Promise<void>;
  getCourseProgress(userId: string): Promise<CourseProgress[]>;
}
```

### Swap Path: Local -> On-Chain

The migration point is intentionally one line in `src/services/index.ts`:

```ts
// Before
export const learningService: ILearningProgressService =
  new LocalLearningProgressService();

// After (planned)
export const learningService: ILearningProgressService =
  new OnChainLearningProgressService();
```

All hooks/components import `learningService` from `@/services`, so no UI-layer rewrite is required.

## On-Chain Integration

This section separates what is already integrated in runtime versus what is scaffolded with TODOs and account specs.

### Fully Implemented

| Area | Status | Notes | Primary files |
| --- | --- | --- | --- |
| Wallet authentication (Solana Wallet Adapter) | Live | Learner identity via wallet connect/disconnect in client UI | `src/providers/SolanaProvider.tsx`, `src/components/ui/wallet-button.tsx` |
| XP balance reading (Token-2022 soulbound token) | Live | Reads Token-2022 accounts via `XPService`; provider falls back to profile XP if missing | `src/services/chain/XPService.ts`, `src/providers/XPProvider.tsx` |
| Credential NFT display (Metaplex Core via Helius DAS) | Live | Fetches owner assets via Helius DAS and maps to app credential shape | `src/services/chain/CredentialService.ts`, `src/components/sections/profile-view.tsx`, `src/components/sections/certificate-view.tsx` |
| Course enrollment transaction (learner-signed) | Implemented at service layer | Enrollment transaction builder exists (`buildEnrollTransaction`), UI flow currently defaults to local enrollment service abstraction | `src/services/chain/EnrollmentService.ts`, `src/services/learning/LocalLearningProgressService.ts` |
| Leaderboard (indexed XP token balances) | Live + migration-ready | Current leaderboard reads from indexed `leaderboard_view`; comments define chain-index strategy | `src/services/learning/LocalLearningProgressService.ts`, `src/hooks/useLeaderboard.ts` |

### Stubbed (Clean Abstractions Ready)

The app includes explicit TODO blocks with Anchor instruction names and account metas.

#### 1) Lesson completion (`CompleteLesson`)

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

#### 2) Course finalization + credential mint (`MintCredential`)

```ts
// TODO (ON-CHAIN): If courseCompleted, send a MintCredential instruction:
// Accounts:
//   [signer, writable]  learner
//   [writable]          new_asset_pda
//   []                  collection_pda
//   []                  mpl_core_program
//   []                  academy_authority
//   []                  system_program
```

#### 3) Achievement claiming (rule engine + claim ix)

Current code has a generic TODO:

```ts
// TODO: Implement achievement rule engine.
```

Recommended TODO pattern (to match existing style):

```ts
// TODO (ON-CHAIN):
// Instruction: ClaimAchievement { achievement_id: String }
// Accounts:
//   [signer, writable]  learner
//   [writable]          achievement_receipt_pda
//   []                  enrollment_pda / streak_pda (proof source)
//   []                  system_program
```

#### 4) XP minting (Token-2022 CPI inside completion flow)

```ts
// Program logic:
//   CPI to Token-2022:
//     mint_to(xp_token_account, lesson_registry_pda.xp_reward)
```

This keeps XP issuance program-controlled and compatible with NonTransferable (soulbound) token design.

## Data Flow

### 1) Content Flow
1. Course/module/lesson docs are authored in Sanity Studio.
2. GROQ queries in `src/sanity/lib/queries.ts` fetch typed projections.
3. Server Components (`src/app/**/page.tsx`) request content.
4. UI sections render typed data with client interactivity.

### 2) User Flow
1. Wallet identity and auth context initialize in providers.
2. User/profile/progress rows are read from Supabase through service classes.
3. Hooks (`useDashboard`, `useCourse`, `useLeaderboard`) orchestrate fetch + cache.
4. Components consume hook state and emit actions/events.

### 3) On-Chain / Indexed Flow
1. XP reads and credential NFT reads call Solana RPC / Helius DAS through chain services.
2. Learning service abstracts whether state comes from Supabase or chain.
3. UI remains backend-agnostic because it only consumes typed service results.

## Key Design Decisions

### Why Next.js App Router
- Server Components reduce JS payload for content-heavy pages.
- Built-in layouts/loading/error routes simplify UX for nested course routes.
- Route-level metadata and static params fit SEO/course catalog requirements.

### Why Sanity
- Flexible authoring model for courses/modules/lessons.
- Rich Portable Text supports code blocks, callouts, and media.
- Easy schema evolution as curriculum grows.

### Why Supabase (for MVP)
- Fast iteration for auth/profile/progress/leaderboard primitives.
- SQL + views make leaderboard and analytics aggregation simple.
- Clear migration seam to on-chain writes through service interfaces.

### Why Service Abstraction Layer
- Prevents direct DB/RPC logic in components.
- Enables staged migration from local/Supabase to full on-chain without UI rewrites.
- Centralizes domain-side effects (XP, streak, course completion, credentials).

## Component Architecture

```text
Providers
  └── App/Layout
       └── Page (route-level data + metadata)
            └── Section components (feature composition)
                 └── UI components (cards, badges, bars, controls)
```

- Providers: auth, wallet, XP, analytics, error boundaries.
- Layouts: locale shell, navbar/footer, global wrappers.
- Pages: route contracts and server data fetching.
- Sections: business-oriented UI (catalog, dashboard, profile, leaderboard).
- UI: reusable presentational primitives.

## State Management

- Server state: Next.js Server Components + fetch/GROQ route data.
- Client state: React Context providers (`AuthProvider`, `XPProvider`, wallet context).
- Cache: custom TTL cache in `src/lib/cache.ts` used by hooks.
- Local persistence: `localStorage` used for progress/streak fast-path logic.
