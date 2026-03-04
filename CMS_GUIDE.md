# CMS Guide — Creating Courses in Sanity

## Accessing the CMS

- Development: `http://localhost:3000/studio`
- Production: `https://[your-domain]/studio`

If `/studio` is unavailable, confirm:
- `sanity.config.ts` exists in root
- Studio route exists at `src/app/studio/[[...tool]]/page.tsx`
- deployment environment has Sanity env variables set.

## Creating a Course

1. Open Studio -> **Courses** -> **New Course**.
2. Fill core metadata:
   - `Title`
   - `Slug` (auto-generated from title)
   - `Description`
   - `Thumbnail` (+ `Alt Text`)
3. Set course settings:
   - `Difficulty` (`beginner` / `intermediate` / `advanced`)
   - `Duration (minutes)`
   - `XP Reward`
   - `Track` (`fundamentals` / `defi` / `security` / `full-stack`)
   - `Language` (`en` / `pt-BR` / `es`)
4. Keep `isPublished = false` while editing.
5. Add module references in `Modules` (see next section).
6. Optional: add prerequisites in `Prerequisites`.
7. Save draft frequently.

## Creating Modules

1. Open Studio -> **Modules** -> **New Module**.
2. Fill:
   - `Title`
   - `Description`
   - `Module Order` (1-based position in course)
3. Add lesson references in `Lessons` array.
4. Save module.
5. Go back to the Course and add this Module in its `Modules` array.
6. Ensure module ordering is correct both in module `order` and course module list.

## Creating Lessons

Lessons support two types:
- **Content lesson** (`type = content`)
- **Challenge lesson** (`type = challenge`)

### Common fields (both types)
- `Title`
- `Slug`
- `Lesson Type`
- `XP Reward`
- `Order`
- `Estimated Minutes`
- `Content Language`

### Content lesson flow
1. Set `type = content`.
2. Add Portable Text blocks under `Content`.
3. Optional: set `videoUrl`.
4. Save and preview in app lesson route.

### Challenge lesson flow
1. Set `type = challenge`.
2. Fill challenge fields:
   - `starterCode` -> code scaffold shown in editor
   - `codeLanguage` -> language for Monaco editor
   - `solutionCode` -> internal reference solution
   - `expectedPatterns` -> strings/regex markers for validator
   - `hints` -> progressive hints
   - `testCases[]`:
     - `description`
     - `expectedOutput`
3. Save and test challenge behavior in the lesson page.

## Content Formatting

The `content` field is Portable Text and supports:

- Rich text blocks (`Normal`, `H2`, `H3`, `H4`, `Quote`)
- Inline formatting (`Bold`, `Italic`, `Code`)
- Images (`alt`, `caption`)
- Custom `Code Block` object
- Custom `Callout` object (`info`, `warning`, `success`, `tip`)

### Code Blocks
When adding a `Code Block` object:
- Set `code`
- Set `language` (`rust`, `typescript`, `javascript`, `shell`, `toml`)
- Optional `filename`
- Optional `highlightLines` (e.g. `3,7-9`)

### Callout Boxes
Add `Callout` object and choose tone:
- `info`
- `warning`
- `success`
- `tip`

Then set `text` content.

### Images
Add image blocks with:
- `alt` for accessibility
- `caption` for context (optional)

## Publishing Workflow

1. Draft content with `isPublished = false`.
2. Internal review:
   - correctness
   - challenge validation quality
   - typo and formatting pass
3. Set `isPublished = true` on the course.
4. Save + publish.
5. Verify on frontend:
   - appears in `/courses`
   - module/lesson order is correct
   - challenge fields render correctly.

## Content Schema Reference

### Course (`course`)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Course display title |
| `slug` | `slug` | Yes | Unique route key |
| `description` | `text` | No | Course summary |
| `thumbnail` | `image` | No | Card/hero image |
| `thumbnail.alt` | `string` | Yes (if image) | Accessibility alt text |
| `difficulty` | `string` | Yes | `beginner/intermediate/advanced` |
| `duration` | `number` | No | Estimated total minutes |
| `xpReward` | `number` | Yes | Course completion XP bonus |
| `track` | `string` | Yes | `fundamentals/defi/security/full-stack` |
| `modules` | `array<reference(module)>` | No | Ordered module references |
| `prerequisites` | `array<reference(course)>` | No | Recommended prior courses |
| `isPublished` | `boolean` | No | Controls catalog visibility |
| `language` | `string` | No | `en/pt-BR/es` |
| `order` | `number` | No | Catalog sort priority |

### Module (`module`)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Module title |
| `description` | `text` | No | Module summary |
| `order` | `number` | Yes | Position inside course |
| `lessons` | `array<reference(lesson)>` | No | Ordered lesson references |

### Lesson (`lesson`)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | Lesson title |
| `slug` | `slug` | Yes | Lesson route key |
| `type` | `string` | Yes | `content` or `challenge` |
| `xpReward` | `number` | Yes | XP awarded for completion |
| `order` | `number` | No | Position within module |
| `estimatedMinutes` | `number` | No | Time estimate |
| `language` | `string` | No | `en/pt-BR/es` |
| `content` | `array` | No | Portable Text content |
| `videoUrl` | `url` | No | Optional embedded video |
| `starterCode` | `text` | Challenge only | Initial code scaffold |
| `codeLanguage` | `string` | Challenge only | Editor language |
| `solutionCode` | `text` | Challenge only | Internal solution |
| `expectedPatterns` | `array<string>` | Challenge only | Pattern checks |
| `hints` | `array<string>` | Challenge only | Hint list |
| `testCases` | `array<object>` | Challenge only | Validation cases |
| `testCases[].description` | `string` | Yes | Human-readable expected behavior |
| `testCases[].expectedOutput` | `string` | Yes | Pattern/output to match |
