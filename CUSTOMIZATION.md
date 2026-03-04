# Customization Guide

## Theme Colors
All tokens are defined in `src/app/globals.css`.

```css
/* Change these to retheme the entire app */
--color-background: #0A0A0F;
--color-surface: #12121A;
--color-surface-2: #1A1A2E;
--color-border: #1E1E2E;
--color-accent-cyan: #00D4FF;
--color-accent-purple: #8B5CF6;
--color-accent-green: #10B981;
--color-xp: #F59E0B;
```

Note: the actual mapped token in this codebase is `--color-surface-2` (with hyphen), not `--color-surface2`.

## Adding a Language

### Step 1: Add locale in routing
File: `src/i18n/routing.ts`

```ts
export const routing = defineRouting({
  locales: ['en', 'pt-BR', 'es', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
```

### Step 2: Add translation file
Create: `src/messages/fr.json`

```bash
cp src/messages/en.json src/messages/fr.json
```

### Step 3: Add locale option in navbar switcher
File: `src/components/layout/navbar.tsx`

```ts
const LOCALE_OPTIONS = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'PT-BR', flag: '🇧🇷' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
] as const;
```

### Step 4: Test locale routes
Verify:
- `/fr`
- `/fr/courses`
- `/fr/dashboard`
- `/fr/leaderboard`
- `/fr/settings`

## Adding an Achievement

### 1. Add to achievements catalog
File: `src/lib/achievements.ts` (`ACHIEVEMENT_DEFINITIONS`)

```ts
{
  id: 'xp-5000',
  title: 'Deep Builder',
  description: 'Reach 5,000 XP total.',
  iconUrl: '/badges/xp-5000.svg',
  type: 'xp',
  requirement: 5000,
  xpReward: 300,
  metric: 'xp',
}
```

### 2. Define unlock condition
Unlock conditions are derived in `getAchievementProgress()` by comparing metric value against `requirement`.

### 3. Achievement appears automatically in UI
No additional wiring needed for standard achievements:
- dashboard recent achievements
- profile achievement grid

## Modifying XP Rewards

Change XP values in:
1. `src/lib/constants.ts` (global defaults)
2. Sanity lesson/course fields (`xpReward`) for content-defined rewards

Current constants:

```ts
export const XP_PER_LESSON = 25 as const;
export const XP_PER_COURSE = 500 as const;
export const LEVEL_FORMULA = (xp: number): number =>
  Math.floor(Math.sqrt(xp / 100));
```

How the level formula works:
```
Level 1:  100 XP  (floor(sqrt(100/100))  = 1)
Level 5:  2500 XP (floor(sqrt(2500/100)) = 5)
Level 10: 10000 XP
```

If you modify `LEVEL_FORMULA`, also validate:
- `getLevelFromXP()` in `src/lib/utils.ts`
- `getLevelProgress()` in `src/lib/utils.ts`
- XP bar/level badge behavior across dashboard and profile.

## Adding a Course Track

### Step 1: Add track option in schema
File: `src/sanity/schemas/course.ts`

```ts
options: {
  list: [
    { title: 'Fundamentals', value: 'fundamentals' },
    { title: 'DeFi', value: 'defi' },
    { title: 'Security', value: 'security' },
    { title: 'Full-Stack', value: 'full-stack' },
    { title: 'Mobile', value: 'mobile' }, // new
  ],
}
```

### Step 2: Add track card in UI
File: `src/components/sections/learning-paths.tsx`
- Add a new card entry for the new track.

### Step 3: Add catalog filter mapping
File: `src/components/sections/course-catalog.tsx`
- Add to `TRACK_OPTIONS`
- Add label mapping in `trackLabel()`
- Add i18n keys to all `src/messages/*.json` files

## Swapping to On-Chain Service

This is the most important customization point.

```typescript
// src/services/index.ts
// Change this one line:
export const learningService =
  new OnChainLearningProgressService()
```

Before switching, implement at minimum:
1. `OnChainLearningProgressService` class implementing full `ILearningProgressService`.
2. On-chain complete lesson flow (`CompleteLesson`) with XP mint CPI.
3. Enrollment and progress reads from PDA/account data.
4. Credential mint/finalization path.
5. Indexing strategy (webhooks or worker) for leaderboard and profile responsiveness.
6. Error/retry behavior parity with current local service.
