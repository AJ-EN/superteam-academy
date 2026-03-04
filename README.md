# Superteam Academy

> The ultimate learning platform for Solana developers.  
> Interactive coding challenges, on-chain XP tokens,  
> and soulbound NFT credentials.

## Overview
Superteam Academy is a Solana-focused learning platform where learners go beyond passive video content and complete structured, hands-on lessons and coding challenges. Progress is reflected through XP, streaks, and track-level completion, creating a clear skill graph instead of a generic course completion list.

The platform is designed for the Superteam Brazil/LATAM ecosystem, where the goal is to help new and intermediate builders move from theory to production contribution. Courses are organized by track (Fundamentals, DeFi, Security, Full Stack), and credentials are designed to be verifiable on-chain so learners can prove competency publicly.

The frontend is built with Next.js App Router and a strict TypeScript service architecture. Content is managed in Sanity, user/profile and leaderboard data is stored in Supabase, and on-chain integrations are handled via Solana RPC + Helius DAS APIs. The codebase intentionally abstracts data operations behind interfaces to support a clean migration from local/Supabase-backed flows to fully on-chain flows.

## Tech Stack
- Next.js App Router (currently `16.1.6`)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Sanity CMS
- Supabase
- Solana Wallet Adapter
- Metaplex Core (NFT credentials)
- Token-2022 (XP tokens)
- Helius DAS API
- Framer Motion
- Monaco Editor
- PostHog + Sentry

## Quick Start
```bash
git clone [repo]
cd superteam-academy-frontend
npm install
cp .env.local.example .env.local
# Fill in environment variables (see .env.local.example)
npm run dev
```

## Environment Variables
Use `.env.local.example` as the source of truth.

| Variable | Required | Description | Where to get it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by frontend SDK | Supabase Dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key for client-side Supabase access | Supabase Dashboard -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role key for privileged server actions | Supabase Dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Solana RPC endpoint (devnet/mainnet) | Solana public RPC or Helius private RPC |
| `NEXT_PUBLIC_ACADEMY_PROGRAM_ID` | On-chain mode | Anchor program ID for academy instructions | Program deployment output (`anchor deploy`) |
| `NEXT_PUBLIC_XP_TOKEN_MINT` | On-chain XP | Token-2022 mint used for XP balances | Program initialization output |
| `NEXT_PUBLIC_XP_TOKEN_DECIMALS` | Recommended | XP token decimals (default `0`) | Token mint config |
| `NEXT_PUBLIC_ACADEMY_COLLECTION_ADDRESS` | NFT credentials | Metaplex Core collection for academy credentials | Collection deployment script output |
| `HELIUS_API_KEY` | For credential APIs | Helius key for DAS calls (`getAssetsByOwner`, `getAsset`) | https://dev.helius.xyz |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID for content queries | https://sanity.io/manage |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset name (usually `production`) | Sanity project settings |
| `SANITY_API_TOKEN` | Server only | Write token for content mutations/admin flows | Sanity API tokens |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project key for analytics capture | PostHog project settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | PostHog host URL (default `https://app.posthog.com`) | PostHog project settings |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN used by client and server init | Sentry project settings |
| `SENTRY_AUTH_TOKEN` | Optional server | Token used for source map uploads in CI/CD | Sentry account tokens |
| `SENTRY_ORG` | Optional server | Sentry organization slug | Sentry org settings |
| `SENTRY_PROJECT` | Optional server | Sentry project slug | Sentry project settings |

## Project Structure
```text
src/
├── app/                    # Next.js App Router pages, layouts, route handlers
│   ├── [locale]/           # Locale-prefixed routes powered by next-intl
│   ├── api/                # API routes (e.g. content endpoints)
│   └── studio/             # Embedded Sanity Studio route
├── components/
│   ├── layout/             # Navbar, footer, shell-level layout components
│   ├── sections/           # Page-level feature sections (catalog, dashboard, profile)
│   └── ui/                 # Reusable primitives (cards, badges, bars, skeletons)
├── hooks/                  # Client data hooks (auth, xp, course, leaderboard, dashboard)
├── i18n/                   # next-intl routing, navigation helpers, request config
├── lib/                    # Shared utils, cache, analytics, sentry, validators
├── messages/               # Translation JSON files (en, pt-BR, es)
├── providers/              # React providers (Auth, Solana, XP, analytics/sentry wrappers)
├── sanity/
│   ├── lib/                # Sanity client, image URL builder, GROQ queries
│   └── schemas/            # Sanity document schemas (course/module/lesson)
├── services/               # Service layer (learning/content/user + chain integrations)
└── types/                  # Shared domain types
```

## Available Scripts
- `npm run dev` -> start local development server
- `npm run build` -> production build
- `npm run lint` -> run ESLint
- `npx tsc --noEmit` -> strict TypeScript check

## Deployment
1. Push the repository to GitHub.
2. Import the project into Vercel.
3. In Vercel Project Settings -> Environment Variables, copy every required key from `.env.local.example`.
4. Set variables for all environments you need (`Production`, `Preview`, `Development`).
5. Deploy the main branch.
6. Validate:
   - `/studio` is reachable (if enabled for that environment)
   - locale routes (`/en`, `/pt-BR`, `/es`)
   - wallet connect + XP read path
   - analytics and error monitoring dashboards receiving events.

## Contributing
Contribution process and cross-package changes are tracked in the **superteam-academy monorepo**.  
Open issues/PRs there for architecture changes that span frontend + on-chain + backend components.
