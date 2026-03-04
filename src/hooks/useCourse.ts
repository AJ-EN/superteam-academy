'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { learningService } from '@/services';
import { getCache, setCache, invalidateCache } from '@/lib/cache';
import type { Course, CourseProgress } from '@/types';
import { useAuth } from './useAuth';

// ─── Cache config ─────────────────────────────────────────────────────────────

/** Course structure from CMS changes rarely — 5-minute TTL. */
const COURSE_TTL = 5 * 60_000;
/** Progress changes on every lesson completion — 30-second TTL. */
const PROGRESS_TTL = 30_000;

const courseKey = (slug: string) => `course:${slug}`;
const progressKey = (userId: string, slug: string) => `progress:${userId}:${slug}`;
const enrollKey = (userId: string, slug: string) => `enrolled:${userId}:${slug}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseCourseReturn {
  /** Full course data fetched from the CMS API route. */
  course: Course | null;
  /** This user's progress in the course. Null if not enrolled or still loading. */
  progress: CourseProgress | null;
  /** True when the user is enrolled (progress record exists). */
  isEnrolled: boolean;
  isLoadingCourse: boolean;
  isLoadingProgress: boolean;
  /** Non-null when either fetch failed. */
  error: Error | null;
  /** Enrol the authenticated user in this course. */
  enroll: () => Promise<void>;
  /** Re-fetch progress (call after completeLesson). */
  refreshProgress: () => Promise<void>;
}

/**
 * Loads course content and the authenticated user's progress for a given slug.
 *
 * Data fetching strategy:
 * - Course content: GET `/api/courses/[slug]` (Server Component / API route
 *   that fetches from Sanity — keeps CMS token server-side).
 * - Progress: `learningService.getProgress()` (Supabase in local mode;
 *   on-chain `EnrollmentAccount` once the program is deployed).
 * - Both are cached in-memory with independent TTLs.
 * - Revalidates on window focus.
 *
 * @param courseSlug - The unique course slug (e.g. `"intro-to-solana"`).
 *
 * @example
 * ```tsx
 * const { course, progress, isEnrolled, enroll } = useCourse('intro-to-solana');
 *
 * if (!isEnrolled) return <EnrollButton onClick={enroll} />;
 * return <CourseContent course={course} progress={progress} />;
 * ```
 */
export function useCourse(courseSlug: string): UseCourseReturn {
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(
    () => getCache<Course>(courseKey(courseSlug)),
  );
  const [progress, setProgress] = useState<CourseProgress | null>(
    () =>
      user ? getCache<CourseProgress>(progressKey(user.id, courseSlug)) : null,
  );
  const [isEnrolled, setIsEnrolled] = useState(
    () =>
      user
        ? (getCache<boolean>(enrollKey(user.id, courseSlug)) ?? false)
        : false,
  );
  const [isLoadingCourse, setIsLoadingCourse] = useState(!course);
  const [isLoadingProgress, setIsLoadingProgress] = useState(isAuthenticated && !progress);
  const [error, setError] = useState<Error | null>(null);

  const enrollingRef = useRef(false);

  // ── Fetch course from CMS API route ─────────────────────────────────────

  const fetchCourse = useCallback(async () => {
    const cached = getCache<Course>(courseKey(courseSlug));
    if (cached) {
      setCourse(cached);
      setIsLoadingCourse(false);
      return; // Background revalidation below handles freshness.
    }

    setIsLoadingCourse(true);
    try {
      // TODO: Create /app/api/courses/[slug]/route.ts that fetches from Sanity.
      // Using SANITY_API_TOKEN (server-side only) and returns Course shape.
      const res = await fetch(`/api/courses/${courseSlug}`);
      if (!res.ok) throw new Error(`Course fetch failed: ${res.status}`);
      const data = (await res.json()) as Course;
      setCache(courseKey(courseSlug), data, COURSE_TTL);
      setCourse(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoadingCourse(false);
    }
  }, [courseSlug]);

  // ── Fetch user progress from service ────────────────────────────────────

  const fetchProgress = useCallback(async () => {
    if (!user) return;

    const cached = getCache<CourseProgress>(progressKey(user.id, courseSlug));
    if (cached) {
      setProgress(cached);
      setIsEnrolled(true);
      setIsLoadingProgress(false);
      return;
    }

    setIsLoadingProgress(true);
    try {
      const prog = await learningService.getProgress(user.id, courseSlug);
      setCache(progressKey(user.id, courseSlug), prog, PROGRESS_TTL);
      setCache(enrollKey(user.id, courseSlug), true, COURSE_TTL);
      setProgress(prog);
      setIsEnrolled(true);
    } catch {
      // Progress not found → not enrolled. Not an error state for the UI.
      setProgress(null);
      setIsEnrolled(false);
    } finally {
      setIsLoadingProgress(false);
    }
  }, [user, courseSlug]);

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (isAuthenticated) fetchProgress();
  }, [isAuthenticated, fetchProgress]);

  // ── Revalidate on focus ──────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => {
      fetchCourse();
      if (isAuthenticated) fetchProgress();
    };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [fetchCourse, fetchProgress, isAuthenticated]);

  // ── Enroll ───────────────────────────────────────────────────────────────

  const enroll = useCallback(async () => {
    if (!user || enrollingRef.current) return;
    if (isEnrolled) return; // Already enrolled.

    enrollingRef.current = true;
    try {
      await learningService.enrollInCourse(user.id, courseSlug);
      // Invalidate and re-fetch progress to get the fresh record.
      invalidateCache(
        progressKey(user.id, courseSlug),
        enrollKey(user.id, courseSlug),
      );
      await fetchProgress();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      enrollingRef.current = false;
    }
  }, [user, courseSlug, isEnrolled, fetchProgress]);

  // ── Refresh progress (call after completeLesson) ─────────────────────────

  const refreshProgress = useCallback(async () => {
    if (!user) return;
    invalidateCache(progressKey(user.id, courseSlug));
    await fetchProgress();
  }, [user, courseSlug, fetchProgress]);

  return {
    course,
    progress,
    isEnrolled,
    isLoadingCourse,
    isLoadingProgress,
    error,
    enroll,
    refreshProgress,
  };
}
