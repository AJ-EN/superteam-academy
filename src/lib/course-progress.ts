const STORAGE_PREFIX = 'academy:course-progress:';
export const COURSE_PROGRESS_EVENT = 'academy:course-progress-updated';

export interface StoredCourseProgress {
  courseSlug: string;
  enrolled: boolean;
  completedLessonIds: string[];
  lastVisitedLessonId?: string | null;
  updatedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getStorageKey(courseSlug: string): string {
  return `${STORAGE_PREFIX}${courseSlug}`;
}

function normalizeProgress(
  courseSlug: string,
  value: unknown,
): StoredCourseProgress {
  if (!value || typeof value !== 'object') {
    return {
      courseSlug,
      enrolled: false,
      completedLessonIds: [],
      lastVisitedLessonId: null,
      updatedAt: new Date().toISOString(),
    };
  }

  const record = value as Partial<StoredCourseProgress>;
  const completedLessonIds = Array.isArray(record.completedLessonIds)
    ? record.completedLessonIds.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    courseSlug,
    enrolled: Boolean(record.enrolled),
    completedLessonIds: [...new Set(completedLessonIds)],
    lastVisitedLessonId:
      typeof record.lastVisitedLessonId === 'string'
        ? record.lastVisitedLessonId
        : null,
    updatedAt: typeof record.updatedAt === 'string'
      ? record.updatedAt
      : new Date().toISOString(),
  };
}

function emitCourseProgressEvent(courseSlug: string): void {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent(COURSE_PROGRESS_EVENT, {
      detail: { courseSlug },
    }),
  );
}

export function getStoredCourseProgress(courseSlug: string): StoredCourseProgress {
  if (!isBrowser()) {
    return {
      courseSlug,
      enrolled: false,
      completedLessonIds: [],
      lastVisitedLessonId: null,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(courseSlug));
    if (!raw) {
      return {
        courseSlug,
        enrolled: false,
        completedLessonIds: [],
        updatedAt: new Date().toISOString(),
      };
    }

    return normalizeProgress(courseSlug, JSON.parse(raw));
  } catch {
    return {
      courseSlug,
      enrolled: false,
      completedLessonIds: [],
      lastVisitedLessonId: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveProgress(progress: StoredCourseProgress): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(getStorageKey(progress.courseSlug), JSON.stringify(progress));
  emitCourseProgressEvent(progress.courseSlug);
}

export function enrollInCourse(courseSlug: string): StoredCourseProgress {
  const current = getStoredCourseProgress(courseSlug);
  const next: StoredCourseProgress = {
    ...current,
    enrolled: true,
    lastVisitedLessonId: current.lastVisitedLessonId ?? null,
    updatedAt: new Date().toISOString(),
  };
  saveProgress(next);
  return next;
}

export function markLessonCompleted(
  courseSlug: string,
  lessonId: string,
): StoredCourseProgress {
  const current = getStoredCourseProgress(courseSlug);
  const next: StoredCourseProgress = {
    ...current,
    enrolled: true,
    completedLessonIds: [...new Set([...current.completedLessonIds, lessonId])],
    lastVisitedLessonId: lessonId,
    updatedAt: new Date().toISOString(),
  };
  saveProgress(next);
  return next;
}

export function setLastVisitedLesson(
  courseSlug: string,
  lessonId: string,
): StoredCourseProgress {
  const current = getStoredCourseProgress(courseSlug);
  const next: StoredCourseProgress = {
    ...current,
    enrolled: current.enrolled,
    lastVisitedLessonId: lessonId,
    updatedAt: new Date().toISOString(),
  };
  saveProgress(next);
  return next;
}
