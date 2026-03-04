'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code,
  Copy,
  Lock,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCourseEnroll } from '@/lib/analytics';
import {
  COURSE_PROGRESS_EVENT,
  enrollInCourse,
  getStoredCourseProgress,
} from '@/lib/course-progress';
import { urlFor } from '@/sanity/lib/image';
import type { SanityCourse } from '@/sanity/lib/queries';

const LANGUAGE_LABEL: Record<string, string> = {
  en: 'English',
  'pt-BR': 'Portuguese (BR)',
  es: 'Spanish',
};

const DIFFICULTY_LABEL: Record<SanityCourse['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function difficultyClass(difficulty: SanityCourse['difficulty']): string {
  if (difficulty === 'beginner') return 'bg-accent-green/10 text-accent-green border-accent-green/30';
  if (difficulty === 'intermediate') return 'bg-xp/10 text-xp border-xp/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
}

function deriveLearningPoints(description: string | null): string[] {
  const fallback = [
    'Understand foundational concepts required to progress in this track.',
    'Apply lessons through practical examples and guided exercises.',
    'Build confidence by completing structured learning milestones.',
    'Prepare for advanced modules with real-world problem solving.',
  ];

  if (!description) return fallback;

  const sentences = description
    .replace(/\n+/g, ' ')
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 18)
    .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1));

  const merged = [...sentences, ...fallback];
  return merged.slice(0, 6);
}

function formatDuration(durationMinutes: number | null): string {
  if (!durationMinutes || durationMinutes <= 0) return 'Self-paced';
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function StarRating({ rating }: { rating: number }) {
  const activeStars = Math.round(rating);
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={16}
          className={cn(
            index < activeStars ? 'fill-xp text-xp' : 'text-text-muted',
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

interface CourseDetailProps {
  course: SanityCourse;
}

export function CourseDetail({ course }: CourseDetailProps) {
  const t = useTranslations();
  const courseSlug = course.slug.current;
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied' | 'error'>('idle');

  const modules = useMemo(
    () =>
      [...course.modules]
        .sort((a, b) => a.order - b.order)
        .map((module) => ({
          ...module,
          lessons: [...module.lessons].sort((a, b) => a.order - b.order),
        })),
    [course.modules],
  );

  const allLessons = useMemo(
    () => modules.flatMap((module) => module.lessons),
    [modules],
  );

  const learningPoints = useMemo(
    () => deriveLearningPoints(course.description),
    [course.description],
  );

  const totalLessonXp = useMemo(
    () => allLessons.reduce((sum, lesson) => sum + lesson.xpReward, 0),
    [allLessons],
  );

  const totalXp = totalLessonXp + course.xpReward;

  const isCompleted =
    allLessons.length > 0 &&
    allLessons.every((lesson) => completedLessonIds.includes(lesson._id));

  const firstIncompleteLesson =
    allLessons.find((lesson) => !completedLessonIds.includes(lesson._id)) ??
    allLessons[0] ??
    null;

  useEffect(() => {
    const syncProgress = () => {
      const progress = getStoredCourseProgress(courseSlug);
      setIsEnrolled(progress.enrolled);
      setCompletedLessonIds(progress.completedLessonIds);
    };

    const onProgressUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ courseSlug?: string }>).detail;
      if (!detail?.courseSlug || detail.courseSlug === courseSlug) {
        syncProgress();
      }
    };

    syncProgress();
    window.addEventListener(COURSE_PROGRESS_EVENT, onProgressUpdate);
    window.addEventListener('focus', syncProgress);

    return () => {
      window.removeEventListener(COURSE_PROGRESS_EVENT, onProgressUpdate);
      window.removeEventListener('focus', syncProgress);
    };
  }, [courseSlug]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const handleEnroll = async () => {
    if (isEnrolled || isEnrolling) return;
    setIsEnrolling(true);
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    const progress = enrollInCourse(courseSlug);
    trackCourseEnroll(courseSlug, course.title);
    setIsEnrolled(progress.enrolled);
    setCompletedLessonIds(progress.completedLessonIds);
    setIsEnrolling(false);
  };

  const handleCopyLink = async () => {
    const currentUrl = window.location.href;
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopyFeedback('copied');
      window.setTimeout(() => setCopyFeedback('idle'), 1500);
    } catch {
      setCopyFeedback('error');
      window.setTimeout(() => setCopyFeedback('idle'), 1500);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : '';

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I am learning ${course.title} on Superteam Academy.`,
  )}&url=${encodeURIComponent(shareUrl)}`;

  const enrolledCount = 1240;
  const completionRate = 67;

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <header className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <nav
                className="mb-4 flex items-center gap-2 text-xs text-text-muted"
                aria-label="Breadcrumb"
              >
                <Link href="/" className="hover:text-text-primary transition-colors">
                  Home
                </Link>
                <ChevronRight aria-hidden size={14} />
                <Link href="/courses" className="hover:text-text-primary transition-colors">
                  Courses
                </Link>
                <ChevronRight aria-hidden size={14} />
                <span className="text-text-secondary">{course.title}</span>
              </nav>

              <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
                {course.title}
              </h1>
              {course.description && (
                <p className="mt-3 text-base leading-relaxed text-text-secondary">
                  {course.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    difficultyClass(course.difficulty),
                  )}
                >
                  {DIFFICULTY_LABEL[course.difficulty]}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-text-secondary">
                  <Clock3 aria-hidden size={14} />
                  {formatDuration(course.duration)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xp">
                  <Zap aria-hidden size={14} />
                  {course.xpReward.toLocaleString()} XP
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-text-secondary">
                  {LANGUAGE_LABEL[course.language] ?? course.language}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-text-secondary">
                  <BookOpen aria-hidden size={14} />
                  {course.totalLessons} lessons
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-sm font-semibold text-text-primary">
                  SB
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Superteam Brazil</p>
                  <p className="text-xs text-text-muted">Course Instructor</p>
                </div>
              </div>
            </header>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-text-primary">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {learningPoints.map((point, index) => (
                  <li key={`${point}-${index}`} className="flex items-start gap-2.5">
                    <CheckCircle2 aria-hidden className="mt-0.5 shrink-0 text-accent-green" size={16} />
                    <span className="text-sm text-text-secondary">{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Course curriculum</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {modules.length} modules • {allLessons.length} lessons • {totalXp.toLocaleString()} total XP
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {modules.map((module, moduleIndex) => {
                  const moduleXp = module.lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);
                  const expanded = expandedModules.includes(module._id);
                  const previewLesson = moduleIndex === 0 ? module.lessons[0] : null;

                  return (
                    <article
                      key={module._id}
                      className="overflow-hidden rounded-xl border border-border bg-background"
                    >
                      <button
                        type="button"
                        onClick={() => toggleModule(module._id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface/70 focus:outline-none focus:ring-2 focus:ring-ring/60"
                        aria-expanded={expanded}
                        aria-controls={`module-lessons-${module._id}`}
                      >
                        <div>
                          <h3 className="font-semibold text-text-primary">{module.title}</h3>
                          <p className="text-xs text-text-secondary">
                            {module.lessons.length} lessons • {moduleXp.toLocaleString()} XP
                          </p>
                        </div>
                        <ChevronDown
                          aria-hidden
                          size={16}
                          className={cn(
                            'text-text-muted transition-transform',
                            expanded && 'rotate-180',
                          )}
                        />
                      </button>

                      {previewLesson && !expanded && (
                        <div className="border-t border-border px-4 py-3">
                          <Link
                            href={`/courses/${course.slug.current}/lessons/${encodeURIComponent(previewLesson._id)}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent-cyan/40 hover:text-text-primary"
                          >
                            <span className="flex items-center gap-2">
                              <BookOpen aria-hidden size={14} />
                              {previewLesson.title}
                            </span>
                            <span className="text-xs text-accent-cyan">Preview</span>
                          </Link>
                        </div>
                      )}

                      {expanded && (
                        <ul id={`module-lessons-${module._id}`} className="border-t border-border px-4 py-3">
                          {module.lessons.map((lesson, lessonIndex) => {
                            const isPreviewLesson = moduleIndex === 0 && lessonIndex === 0;
                            const unlocked = isEnrolled || isPreviewLesson;
                            const completed = completedLessonIds.includes(lesson._id);
                            const lessonHref = `/courses/${course.slug.current}/lessons/${encodeURIComponent(lesson._id)}`;

                            return (
                              <li key={lesson._id} className="mb-2 last:mb-0">
                                {unlocked ? (
                                  <Link
                                    href={lessonHref}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:border-accent-cyan/40"
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      {lesson.type === 'challenge' ? (
                                        <Code aria-hidden size={14} className="text-accent-cyan" />
                                      ) : (
                                        <BookOpen aria-hidden size={14} className="text-text-secondary" />
                                      )}
                                      <span className="truncate text-sm text-text-primary">
                                        {lesson.title}
                                      </span>
                                      {completed && (
                                        <Check aria-hidden size={14} className="shrink-0 text-accent-green" />
                                      )}
                                    </span>
                                    <span className="flex items-center gap-3 text-xs text-text-secondary">
                                      <span>{lesson.estimatedMinutes}m</span>
                                      <span className="text-xp">{lesson.xpReward} XP</span>
                                    </span>
                                  </Link>
                                ) : (
                                  <div
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-muted"
                                    aria-label={`${lesson.title} is locked`}
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      {lesson.type === 'challenge' ? (
                                        <Code aria-hidden size={14} />
                                      ) : (
                                        <BookOpen aria-hidden size={14} />
                                      )}
                                      <span className="truncate">{lesson.title}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <span>{lesson.xpReward} XP</span>
                                      <Lock aria-hidden size={14} />
                                    </span>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Reviews</h2>
                  <p className="mt-1 text-sm text-text-secondary">What learners are saying</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-text-primary">4.8/5</div>
                  <StarRating rating={4.8} />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Rafael P.',
                    text: 'Clear explanations and strong examples. The challenge lessons made concepts stick quickly.',
                  },
                  {
                    name: 'Camila S.',
                    text: 'Great pacing for beginners. I liked the structure of each module and XP feedback.',
                  },
                  {
                    name: 'Mateus L.',
                    text: 'Good progression from theory to hands-on practice. Looking forward to more advanced tracks.',
                  },
                ].map((review) => (
                  <article
                    key={review.name}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">{review.name}</p>
                      <StarRating rating={5} />
                    </div>
                    <p className="text-sm text-text-secondary">{review.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="relative mb-4 h-48 overflow-hidden rounded-xl bg-surface-2">
                {course.thumbnail ? (
                  <Image
                    src={urlFor(course.thumbnail).width(800).height(450).format('webp').url()}
                    alt={course.thumbnail.alt ?? course.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 30vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen aria-hidden className="text-text-muted" size={28} />
                  </div>
                )}
              </div>

              <div className="mb-4 rounded-xl border border-xp/20 bg-xp/10 p-4">
                <p className="text-xs uppercase tracking-wider text-text-secondary">Course Reward</p>
                <p className="mt-1 text-2xl font-bold text-xp">{course.xpReward.toLocaleString()} XP</p>
              </div>

              {isCompleted ? (
                <button
                  type="button"
                  disabled
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-accent-green/40 bg-accent-green/15 px-4 py-3 text-sm font-semibold text-accent-green"
                >
                  {t('courses.completed')} ✓
                </button>
              ) : isEnrolling ? (
                <button
                  type="button"
                  disabled
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-3 text-sm font-semibold text-accent-cyan"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
                  Enrolling...
                </button>
              ) : isEnrolled && firstIncompleteLesson ? (
                <Link
                  href={`/courses/${course.slug.current}/lessons/${encodeURIComponent(firstIncompleteLesson._id)}`}
                  className="mb-4 flex w-full items-center justify-center rounded-xl bg-accent-cyan px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/60"
                >
                  {t('courses.continue')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleEnroll}
                  className="mb-4 flex w-full items-center justify-center rounded-xl bg-accent-cyan px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/60"
                >
                  {t('courses.enroll')}
                </button>
              )}

              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="mb-4 border-t border-border pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-text-primary">Prerequisites</h3>
                  <ul className="space-y-1.5 text-sm text-text-secondary">
                    {course.prerequisites.map((prerequisite) => (
                      <li key={prerequisite._id}>
                        <Link
                          href={`/courses/${prerequisite.slug.current}`}
                          className="inline-flex items-center gap-1 hover:text-text-primary"
                        >
                          <ChevronRight aria-hidden size={14} />
                          {prerequisite.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-4 border-t border-border pt-4">
                <h3 className="mb-2 text-sm font-semibold text-text-primary">Share</h3>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={twitterHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                  >
                    Twitter
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/60"
                  >
                    <Copy aria-hidden size={13} />
                    {copyFeedback === 'copied'
                      ? 'Copied'
                      : copyFeedback === 'error'
                        ? 'Try Again'
                        : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-2 text-sm font-semibold text-text-primary">Stats</h3>
                <dl className="space-y-2 text-sm text-text-secondary">
                  <div className="flex items-center justify-between">
                    <dt className="inline-flex items-center gap-1.5">
                      <Users aria-hidden size={14} />
                      Enrolled
                    </dt>
                    <dd className="text-text-primary">{enrolledCount.toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="inline-flex items-center gap-1.5">
                      <BarChart3 aria-hidden size={14} />
                      Completion Rate
                    </dt>
                    <dd className="text-text-primary">{completionRate}%</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
