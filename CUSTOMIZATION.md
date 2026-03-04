# Customization Guide

## Adding a New Language

Current locales are defined in `src/i18n/routing.ts`:
- `en`
- `pt-BR`
- `es`

### Step 1: Add locale to routing

Update `src/i18n/routing.ts`:

```ts
export const routing = defineRouting({
  locales: ['en', 'pt-BR', 'es', 'fr'], // add new locale
  defaultLocale: 'en',
  localePrefix: 'always',
});
```

### Step 2: Create message file

Create `src/messages/[locale].json` (example: `src/messages/fr.json`) by copying `src/messages/en.json`.

### Step 3: Add option to language switcher

Update locale options in `src/components/layout/navbar.tsx`:

```ts
const LOCALE_OPTIONS = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'PT-BR', flag: '🇧🇷' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' }, // new
] as const;
```

### Step 4: Test locale routes

Check all major routes under the new prefix:
- `/fr`
- `/fr/courses`
- `/fr/dashboard`
- `/fr/leaderboard`
- `/fr/profile/...`
- `/fr/settings`

## Changing the Color Theme

Core design tokens are in `src/app/globals.css` under `:root` and mapped via `@theme inline`.

Primary variables to update:
- `--color-background`
- `--color-surface`
- `--color-accent-cyan`
- `--color-accent-purple`

### Full token list (current values)

| CSS Variable | Current Value |
| --- | --- |
| `--background` | `#0A0A0F` |
| `--surface` | `#12121A` |
| `--surface-2` | `#1A1A2E` |
| `--accent-cyan` | `#00D4FF` |
| `--accent-purple` | `#8B5CF6` |
| `--accent-green` | `#10B981` |
| `--xp` | `#F59E0B` |
| `--text-primary` | `#F1F5F9` |
| `--text-secondary` | `#94A3B8` |
| `--text-muted` | `#475569` |
| `--border` | `#1E1E2E` |
| `--ring` | `#00D4FF` |
| `--primary` | `#00D4FF` |
| `--accent` | `#8B5CF6` |

After edits:
1. Run `npm run dev`
2. Visually test key screens (`home`, `courses`, `dashboard`, `lesson`)
3. Verify text contrast and focus ring visibility.

## Adding Achievement Types

Achievement catalog is in `src/lib/achievements.ts`.

### 1) Add definition to catalog

Append a new entry to `ACHIEVEMENT_DEFINITIONS`:

```ts
{
  id: 'challenge-20',
  title: 'Challenge Specialist',
  description: 'Complete 20 challenge lessons.',
  iconUrl: '/badges/challenge-20.svg',
  type: 'challenge',
  requirement: 20,
  xpReward: 150,
  metric: 'courses', // or extend metric union
}
```

### 2) Define unlock metric

`AchievementMetric` currently supports:
- `xp`
- `streak`
- `courses`

If you need a new metric (e.g. `challenges`):
1. Extend `AchievementMetric` union.
2. Extend `getAchievementProgress()` input.
3. Add matching branch in progress calculation.

### 3) Unlock logic

Unlocking is derived in `getAchievementProgress()` (this is the current equivalent of `deriveAchievements()` in older docs/comments).

### 4) UI integration

No extra UI wiring is needed for standard achievements:
- Dashboard recent achievements
- Profile achievement showcase

Both consume the same derived progress shape.

## Adding Course Tracks

### 1) Add track option in Sanity schema

File: `src/sanity/schemas/course.ts`  
Update `track` field `options.list`.

### 2) Add track card in Learning Paths

File: `src/components/sections/learning-paths.tsx`  
Add a card for the new track slug/title/description.

### 3) Add filter option in catalog

File: `src/components/sections/course-catalog.tsx`  
Update:
- `TRACK_OPTIONS`
- `trackLabel()` mapping
- translation keys in `src/messages/*.json`

### 4) Validate

Test:
- filter pills
- URL param sync (`?track=...`)
- course cards tags
- translated labels across locales.

## Extending the Gamification System

### XP Formula

Current constants (`src/lib/constants.ts`):

```ts
export const XP_PER_LESSON = 25 as const;
export const XP_PER_COURSE = 500 as const;
```

### Modify rewards
- Change constants in `src/lib/constants.ts`
- If using DB functions (e.g. lesson completion RPC), keep values aligned there too
- Re-test leaderboard and level-up behavior

### Level Curve

Current formula:

```ts
export const LEVEL_FORMULA = (xp: number): number =>
  Math.floor(Math.sqrt(xp / 100));
```

This gives:
- faster early levels
- gradually slower progression at higher levels

### Adjusting the curve

Examples:
- Slower progression: increase divisor (`/ 150`, `/ 200`)
- Faster progression: decrease divisor (`/ 80`)
- Linear model: replace with `Math.floor(xp / N)` (not recommended for long-term pacing)

After changing level formula:
1. Validate `getLevelFromXP()` and `getLevelProgress()` in `src/lib/utils.ts`
2. Test XP bar behavior at level boundaries
3. Check leaderboard level display consistency.
