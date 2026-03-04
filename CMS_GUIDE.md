# CMS Guide

## Accessing Sanity Studio
- Local: http://localhost:3000/studio
- Production: https://superteam-academy-brown.vercel.app/studio

## Content Structure
```
Course
└── Module (ordered)
    └── Lesson (ordered)
        ├── Content Lesson (portable text)
        └── Challenge Lesson (code + validation)
```

## Creating Your First Course

### Step 1: Create Lessons First
Bottom-up approach: create lessons first, then modules, then course.

#### Content lesson (field-by-field)
Required/primary fields from `src/sanity/schemas/lesson.ts`:
- `title` - lesson display name
- `slug` - route identifier generated from title
- `type` - set to `content`
- `xpReward` - XP awarded on completion
- `order` - position inside module
- `estimatedMinutes` - duration estimate
- `language` - `en`, `pt-BR`, or `es`
- `content` - portable text body (blocks, images, codeBlock, callout)
- `videoUrl` (optional)

#### Challenge lesson (field-by-field)
Set `type = challenge`, then configure:
- `starterCode` - initial editor scaffold
- `codeLanguage` - challenge language (`rust`, `typescript`, `javascript`)
- `solutionCode` - internal reference solution
- `expectedPatterns` - required code/output patterns
- `hints` - progressive learner guidance
- `testCases[]`:
  - `description`
  - `expectedOutput`

### Step 2: Create Modules
1. Go to Studio -> Modules -> New Module.
2. Fill:
   - `title`
   - `description`
   - `order`
3. Add lesson references in `lessons[]`.

Ordering behavior:
- Module order is controlled by `module.order`.
- Lesson order inside a module is controlled by `lesson.order`.

### Step 3: Create the Course
1. Go to Studio -> Courses -> New Course.
2. Fill all course fields:
   - `title`, `slug`, `description`
   - `thumbnail` (+ `alt`)
   - `difficulty`
   - `duration`
   - `xpReward`
   - `track`
   - `language`
   - `order`
3. Add module references in `modules[]`.
4. Keep `isPublished = false` while editing/testing.
5. Set `isPublished = true` only when ready.

## Challenge Lesson Configuration

### expectedPatterns
These are required strings/regex-like patterns that validator logic checks in learner submissions.

```js
// Student must use these in their code
expectedPatterns: [
  'SystemProgram.transfer',
  'sendAndConfirmTransaction',
  'new Transaction()'
]
```

Guidelines:
- Keep patterns behavior-focused, not formatting-focused.
- Avoid overly broad patterns that pass incorrect logic.
- Pair with test cases for better reliability.

### testCases
Each test case should describe expected behavior and output marker.

Good test case practices:
- One behavior per test case.
- Human-readable `description`.
- Deterministic `expectedOutput`.
- Cover happy path + at least one edge path pattern.

### hints
Hints should be progressive:
1. Concept reminder
2. API/function nudge
3. Near-solution structural hint

Avoid giving final code directly in hint #1.

## Publishing Workflow
Draft -> Test locally -> Publish

Suggested checklist before publish:
- Route loads (`/courses/[slug]`, lesson pages)
- Challenge runs and validator feedback is meaningful
- Ordering is correct
- `isPublished` enabled

## Importing the Mock Course
```bash
# The mock course is in src/sanity/seed/mockCourse.ts
# To import via Sanity CLI:
npx sanity dataset import
```

Note: adapt CLI arguments (`<file> <dataset>`) to your Sanity project setup.

## Content Schema Reference

### Course Fields

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | Course title |
| `slug` | `slug` | URL-safe course identifier |
| `description` | `text` | Course summary |
| `thumbnail` | `image` | Course image |
| `thumbnail.alt` | `string` | Accessibility text |
| `difficulty` | `string` | `beginner` / `intermediate` / `advanced` |
| `duration` | `number` | Estimated total minutes |
| `xpReward` | `number` | XP for full course completion |
| `track` | `string` | `fundamentals` / `defi` / `security` / `full-stack` |
| `modules` | `array<reference(module)>` | Ordered module references |
| `prerequisites` | `array<reference(course)>` | Recommended prerequisite courses |
| `isPublished` | `boolean` | Visibility flag in catalog |
| `language` | `string` | Content language |
| `order` | `number` | Display order in catalog |

### Module Fields

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | Module title |
| `description` | `text` | Module summary |
| `order` | `number` | Position in parent course |
| `lessons` | `array<reference(lesson)>` | Ordered lesson references |

### Lesson Fields

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | Lesson title |
| `slug` | `slug` | Lesson identifier |
| `type` | `string` | `content` or `challenge` |
| `xpReward` | `number` | XP reward |
| `order` | `number` | Order in module |
| `estimatedMinutes` | `number` | Duration estimate |
| `language` | `string` | Language (`en`, `pt-BR`, `es`) |
| `content` | `array` | Portable text body |
| `videoUrl` | `url` | Optional lesson video |
| `starterCode` | `text` | Challenge scaffold |
| `codeLanguage` | `string` | Challenge language |
| `solutionCode` | `text` | Internal solution |
| `expectedPatterns` | `array<string>` | Validation patterns |
| `hints` | `array<string>` | Progressive hints |
| `testCases` | `array<object>` | Challenge validation cases |
