import { sanityClient } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript shapes for GROQ query results
// These are lighter than the full src/types/index.ts Course type since they
// come from CMS projections, not the service layer.
// ─────────────────────────────────────────────────────────────────────────────

export interface SanitySlug {
  current: string;
}

export interface SanityImage {
  _type: 'image';
  asset: { _ref: string; _type: 'reference' };
  hotspot?: { x: number; y: number; height: number; width: number };
  alt?: string;
}

export interface SanityBlock {
  _type: 'block' | 'codeBlock' | 'callout' | 'image';
  _key: string;
  [key: string]: unknown;
}

export interface SanityTestCase {
  _key: string;
  description: string;
  expectedOutput: string;
}

export interface SanityLessonSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  type: 'content' | 'challenge';
  xpReward: number;
  order: number;
  estimatedMinutes: number;
}

export interface SanityLesson extends SanityLessonSummary {
  content: SanityBlock[] | null;
  videoUrl: string | null;
  language: string;
  starterCode: string | null;
  codeLanguage: 'rust' | 'typescript' | 'javascript' | null;
  solutionCode: string | null;
  expectedPatterns: string[] | null;
  hints: string[] | null;
  testCases: SanityTestCase[] | null;
}

export interface SanityModuleSummary {
  _id: string;
  title: string;
  description: string | null;
  order: number;
}

export interface SanityModule extends SanityModuleSummary {
  lessons: SanityLessonSummary[];
}

export interface SanityModuleFull extends SanityModuleSummary {
  lessons: SanityLesson[];
}

export interface SanityCourseSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  description: string | null;
  thumbnail: SanityImage | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number | null;
  xpReward: number;
  track: 'fundamentals' | 'defi' | 'security' | 'full-stack';
  language: string;
  order: number;
}

export interface SanityCourse extends SanityCourseSummary {
  isPublished: boolean;
  modules: SanityModuleFull[];
  prerequisites: SanityCourseSummary[] | null;
  moduleCount: number;
  totalLessons: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared GROQ projection fragments
// ─────────────────────────────────────────────────────────────────────────────

const COURSE_SUMMARY_PROJECTION = `
  _id,
  title,
  slug,
  description,
  thumbnail { asset, hotspot, alt },
  difficulty,
  duration,
  xpReward,
  track,
  language,
  order
`;

const LESSON_SUMMARY_PROJECTION = `
  _id,
  title,
  slug,
  type,
  xpReward,
  order,
  estimatedMinutes
`;

const LESSON_FULL_PROJECTION = `
  ${LESSON_SUMMARY_PROJECTION},
  content,
  videoUrl,
  language,
  starterCode,
  codeLanguage,
  solutionCode,
  expectedPatterns,
  hints,
  testCases[] {
    _key,
    description,
    expectedOutput
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all published courses, ordered by their `order` field.
 * Returns only summary fields — use `getCourseBySlug` for the full course.
 */
export async function getAllCourses(): Promise<SanityCourseSummary[]> {
  return sanityClient.fetch<SanityCourseSummary[]>(
    `*[_type == "course" && isPublished == true] | order(order asc) {
      ${COURSE_SUMMARY_PROJECTION},
      "moduleCount": count(modules)
    }`,
  );
}

/**
 * Fetch a single course by its slug, including all modules and lessons.
 *
 * @param slug - The course slug (e.g. `"intro-to-solana"`).
 */
export async function getCourseBySlug(slug: string): Promise<SanityCourse | null> {
  return sanityClient.fetch<SanityCourse | null>(
    `*[_type == "course" && slug.current == $slug][0] {
      ${COURSE_SUMMARY_PROJECTION},
      isPublished,
      "moduleCount": count(modules),
      "totalLessons": count(modules[]->lessons[]),
      modules[]-> {
        _id,
        title,
        description,
        order,
        lessons[]-> {
          ${LESSON_FULL_PROJECTION}
        }
      } | order(order asc),
      prerequisites[]-> {
        ${COURSE_SUMMARY_PROJECTION}
      }
    }`,
    { slug },
  );
}

/**
 * Fetch the first 6 published courses for the homepage featured section.
 * Ordered by `order` field ascending.
 */
export async function getFeaturedCourses(): Promise<SanityCourseSummary[]> {
  return sanityClient.fetch<SanityCourseSummary[]>(
    `*[_type == "course" && isPublished == true] | order(order asc) [0...6] {
      ${COURSE_SUMMARY_PROJECTION}
    }`,
  );
}

/**
 * Fetch a single lesson by its Sanity document ID.
 *
 * @param id - The Sanity document `_id`.
 */
export async function getLessonById(id: string): Promise<SanityLesson | null> {
  return sanityClient.fetch<SanityLesson | null>(
    `*[_type == "lesson" && _id == $id][0] {
      ${LESSON_FULL_PROJECTION}
    }`,
    { id },
  );
}

/**
 * Full-text search across course titles and descriptions.
 *
 * Uses Sanity's `match` operator — searches for words starting with `query`.
 * For exact substring matching, use `$query` in `title` instead.
 *
 * @param query - The search string (e.g. `"solana program"`).
 */
export async function searchCourses(query: string): Promise<SanityCourseSummary[]> {
  return sanityClient.fetch<SanityCourseSummary[]>(
    `*[_type == "course" && isPublished == true && (
      title match $pattern || description match $pattern
    )] | order(order asc) {
      ${COURSE_SUMMARY_PROJECTION}
    }`,
    { pattern: `${query}*` },
  );
}

/**
 * Fetch all published courses in a specific track.
 *
 * @param track - One of `"fundamentals"` | `"defi"` | `"security"` | `"full-stack"`.
 */
export async function getCoursesByTrack(
  track: SanityCourse['track'],
): Promise<SanityCourseSummary[]> {
  return sanityClient.fetch<SanityCourseSummary[]>(
    `*[_type == "course" && isPublished == true && track == $track] | order(order asc) {
      ${COURSE_SUMMARY_PROJECTION}
    }`,
    { track },
  );
}

/**
 * Fetch all published courses at a specific difficulty level.
 *
 * @param difficulty - One of `"beginner"` | `"intermediate"` | `"advanced"`.
 */
export async function getCoursesByDifficulty(
  difficulty: SanityCourse['difficulty'],
): Promise<SanityCourseSummary[]> {
  return sanityClient.fetch<SanityCourseSummary[]>(
    `*[_type == "course" && isPublished == true && difficulty == $difficulty] | order(order asc) {
      ${COURSE_SUMMARY_PROJECTION}
    }`,
    { difficulty },
  );
}
