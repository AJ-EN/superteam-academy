# Superteam Academy

> The ultimate learning platform for Solana developers.
> Interactive coding challenges, on-chain XP tokens,
> and soulbound NFT credentials. Built for Superteam Brazil.

## Overview
Superteam Academy is a Solana-native learning platform for developers who want hands-on practice instead of passive content. It is designed for builders in the Superteam Brazil and LATAM ecosystem, with structured tracks, progress visibility, and challenge-first lessons that map to real developer workflows.

The frontend uses Next.js App Router with strict TypeScript and a service abstraction layer. Course content is authored in Sanity CMS and delivered through typed GROQ queries. User profile, progress, leaderboard views, and settings are currently backed by Supabase for rapid iteration and operational simplicity.

On-chain architecture is integrated as first-class infrastructure: XP is represented as Token-2022 soulbound balances, and credentials are represented as Metaplex Core assets queried via Helius DAS. Enrollment transaction scaffolding and PDA patterns are already in place, with clean migration paths for lesson completion, course finalization, and achievement claiming.

## Live Demo
https://superteam-academy-brown.vercel.app

## Tech Stack

| Technology | Purpose | Version |
| --- | --- | --- |
| Next.js | App Router framework, SSR/RSC, routing | 16.1.6 |
| React | UI rendering and hooks | 19.2.3 |
| TypeScript | Strict typing across app and services | 5.x |
| Tailwind CSS | Utility-first styling system | 4.x |
| shadcn/ui tooling | Design token + component integration | 3.8.5 |
| next-intl | Locale routing and translations | 4.8.3 |
| next-themes | Theme management | 0.4.6 |
| Framer Motion | UI animation and transitions | 12.34.3 |
| Monaco Editor (`@monaco-editor/react`) | In-browser coding editor for challenges | 4.7.0 |
| `@portabletext/react` | Render Sanity portable text lesson content | 6.0.2 |
| Sanity (`sanity`, `next-sanity`, `@sanity/client`) | CMS + content APIs | 5.12.0 / 12.1.0 / 7.16.0 |
| Supabase (`@supabase/supabase-js`) | User/profile/progress data layer | 2.98.0 |
| Solana Web3 (`@solana/web3.js`) | RPC connectivity and transaction primitives | 1.98.4 |
| Solana Wallet Adapter | Browser wallet auth + tx signing | 0.15.39 / 0.9.39 / 0.19.37 |
| Metaplex Core (`@metaplex-foundation/mpl-core`) | Credential NFT standard | 1.7.0 |
| Helius DAS API | Indexed NFT/asset querying | API integration |
| PostHog (`posthog-js`) | Product analytics and event tracking | 1.356.1 |
| Sentry (`@sentry/nextjs`) | Error and performance monitoring | 10.40.0 |
| Recharts | Profile radar chart visualization | 3.7.0 |
| html2canvas | Certificate image export | 1.4.1 |

## Quick Start
```bash
git clone https://github.com/AJ-EN/superteam-academy.git
cd superteam-academy
npm install
cp .env.local.example .env.local
# Fill in environment variables
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Description | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by client SDK | Supabase Dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for client-side Supabase calls | Supabase Dashboard -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged operations | Supabase Dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | RPC endpoint used by wallet + chain services | Solana RPC provider (public or Helius private RPC) |
| `NEXT_PUBLIC_ACADEMY_PROGRAM_ID` | Academy Anchor program ID | Program deployment output (`anchor deploy`) |
| `NEXT_PUBLIC_XP_TOKEN_MINT` | Token-2022 XP mint address | Program initialization output |
| `NEXT_PUBLIC_XP_TOKEN_DECIMALS` | XP token decimals (`0` by default) | Token mint configuration |
| `NEXT_PUBLIC_ACADEMY_COLLECTION_ADDRESS` | Metaplex Core collection for credentials | Collection deployment script output |
| `HELIUS_API_KEY` | Server-side key for DAS API queries | https://dev.helius.xyz |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | https://sanity.io/manage |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name | Sanity project settings |
| `SANITY_API_TOKEN` | Server-side token for write operations | Sanity API tokens |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key for analytics | PostHog project settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL | PostHog project settings |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client/server telemetry | Sentry project settings |
| `SENTRY_AUTH_TOKEN` | Token for source map upload in CI/CD | Sentry account tokens |
| `SENTRY_ORG` | Sentry org slug | Sentry org settings |
| `SENTRY_PROJECT` | Sentry project slug | Sentry project settings |

## Project Structure
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # Reusable UI primitives
│   ├── layout/      # Navbar, sidebar, footer
│   └── sections/    # Page sections
├── services/         # Service abstraction layer
│   ├── learning/    # ILearningProgressService
│   └── chain/       # Solana on-chain services
├── providers/        # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Utilities and constants
├── sanity/           # CMS schemas and queries
├── types/            # TypeScript interfaces
├── i18n/             # Internationalization
└── messages/         # Translation files (EN/PT-BR/ES)
```

## Pages

| Route | Description | Auth Required |
| --- | --- | --- |
| `/` | Root redirect to default locale (`/en`) | No |
| `/[locale]` | Localized landing page | No |
| `/[locale]/courses` | Course catalog with filters and URL params | No |
| `/[locale]/courses/[slug]` | Course detail page and curriculum | No |
| `/[locale]/courses/[slug]/lessons/[lessonId]` | Lesson/challenge experience with editor | No (preview) |
| `/[locale]/dashboard` | User dashboard (XP, streak, activity, recommendations) | Yes |
| `/[locale]/leaderboard` | Global rankings and timeframe filters | No |
| `/[locale]/profile` | Redirect to own profile or home | Conditional |
| `/[locale]/profile/[username]` | Public/own profile page | No |
| `/[locale]/settings` | User settings page | Yes |
| `/[locale]/certificates/[id]` | Certificate viewer + verification + sharing | No |
| `/studio` | Embedded Sanity Studio | Team/admin |

## Available Scripts
- npm run dev — Start development server
- npm run build — Production build
- npm run lint — ESLint check
- npx tsc --noEmit — TypeScript check

## Deployment
1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Set Framework Preset to Next.js.
4. Add all variables from `.env.local.example` in Vercel Project Settings -> Environment Variables.
5. Configure values for `Production`, `Preview`, and `Development` environments as needed.
6. Deploy the main branch.
7. Validate post-deploy:
   - locale routes (`/en`, `/pt-BR`, `/es`)
   - wallet connect flow
   - dashboard/profile/leaderboard pages
   - `/studio` access
   - analytics (PostHog) and error tracking (Sentry) ingestion

## On-Chain Integration Status

### IMPLEMENTED

| Feature | Implementation | Status |
| --- | --- | --- |
| Wallet auth | Solana Wallet Adapter providers + wallet UI | Implemented |
| XP balance | `XPService.getXPBalance()` via Token-2022 account read | Implemented |
| Credentials | `CredentialService` via Helius DAS (`getAssetsByOwner`, `getAsset`) | Implemented |
| Enrollment | `EnrollmentService.buildEnrollTransaction()` + local fallback service path | Implemented (hybrid) |
| Leaderboard | Indexed leaderboard view + timeframe filters in service/hook layer | Implemented |

### STUBBED (ready for on-chain)

| Feature | Stub Location | On-Chain Path |
| --- | --- | --- |
| Lesson completion | `src/services/learning/LocalLearningProgressService.ts` (`completeLesson`) | `CompleteLesson` instruction + Token-2022 CPI mint |
| Course finalization | `src/services/learning/LocalLearningProgressService.ts` (credential mint TODO) | `MintCredential` instruction after completion proof |
| Achievements | `src/services/learning/LocalLearningProgressService.ts` (rule-engine TODO) | Program-side claim/receipt PDA flow + indexed sync |

## License
MIT
