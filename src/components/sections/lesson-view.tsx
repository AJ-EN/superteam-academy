'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { EditorSkeleton } from '@/components/ui/skeletons';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Lightbulb,
  Play,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackChallengeAttempt, trackLessonComplete } from '@/lib/analytics';
import {
  markLessonCompleted,
  getStoredCourseProgress,
  setLastVisitedLesson,
} from '@/lib/course-progress';
import {
  validateCode,
  validateTestCases,
  type TestCase,
  type ValidationResult,
} from '@/lib/lesson-validator';
import { urlFor } from '@/sanity/lib/image';
import type { SanityCourse, SanityImage, SanityLesson } from '@/sanity/lib/queries';

type LessonTab = 'lesson' | 'editor';

interface CodeBlockValue {
  _type: 'codeBlock';
  code?: string;
  language?: string;
  filename?: string;
}

interface CalloutValue {
  _type: 'callout';
  tone?: 'info' | 'warning' | 'success' | 'tip';
  text?: string;
}

interface ImageBlockValue extends SanityImage {
  caption?: string;
}

export interface LessonNavItem {
  _id: string;
  title: string;
  type: SanityLesson['type'];
  xpReward: number;
}

interface LessonViewProps {
  lesson: SanityLesson;
  course: SanityCourse;
  prevLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
}

function outputPanelState(
  result: ValidationResult | null,
): 'neutral' | 'pass' | 'fail' {
  if (!result) return 'neutral';
  return result.passed ? 'pass' : 'fail';
}

export function LessonView({
  lesson,
  course,
  prevLesson,
  nextLesson,
}: LessonViewProps) {
  const courseSlug = course.slug.current;
  const router = useRouter();
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const [mobileTab, setMobileTab] = useState<LessonTab>('lesson');
  const [editorValue, setEditorValue] = useState(lesson.starterCode ?? '');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [contentTimerDone, setContentTimerDone] = useState(lesson.type === 'challenge');
  const [isLessonCompleted, setIsLessonCompleted] = useState(() =>
    getStoredCourseProgress(courseSlug).completedLessonIds.includes(lesson._id),
  );

  const isChallenge = lesson.type === 'challenge';

  useEffect(() => {
    setLastVisitedLesson(courseSlug, lesson._id);
  }, [courseSlug, lesson._id]);

  useEffect(() => {
    if (lesson.type !== 'content') return;
    const timer = window.setTimeout(() => {
      setContentTimerDone(true);
    }, 30_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [lesson.type]);

  // Keyboard shortcuts: Alt+← prev, Alt+→ next, Alt+Enter run code
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft' && prevLesson) {
        e.preventDefault();
        router.push(`/courses/${courseSlug}/lessons/${encodeURIComponent(prevLesson._id)}`);
      } else if (e.key === 'ArrowRight' && nextLesson) {
        e.preventDefault();
        router.push(`/courses/${courseSlug}/lessons/${encodeURIComponent(nextLesson._id)}`);
      } else if (e.key === 'Enter' && isChallenge) {
        e.preventDefault();
        runButtonRef.current?.click();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, courseSlug, prevLesson, nextLesson, isChallenge]);

  const challengeTestCases = useMemo<TestCase[]>(
    () =>
      (lesson.testCases ?? []).map((testCase) => ({
        id: testCase._key,
        description: testCase.description,
        expectedOutput: testCase.expectedOutput,
      })),
    [lesson.testCases],
  );

  const canMarkComplete = isLessonCompleted ||
    (isChallenge ? Boolean(result?.passed) : contentTimerDone);

  const handleRunCode = async () => {
    if (isRunning) return;

    setIsRunning(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    const patternValidation = validateCode(editorValue, lesson.expectedPatterns ?? []);
    const testCaseResults = validateTestCases(editorValue, challengeTestCases);
    const failedTestPatterns = testCaseResults
      .filter((test) => !test.passed)
      .map((test) => test.testCase.expectedOutput);
    const uniqueFailedPatterns = [...new Set([
      ...patternValidation.failedPatterns,
      ...failedTestPatterns,
    ])];
    const passed = patternValidation.passed && failedTestPatterns.length === 0;

    setResult({
      passed,
      failedPatterns: uniqueFailedPatterns,
      message: passed
        ? 'All tests passed!'
        : uniqueFailedPatterns.length > 0
          ? `Missing pattern: ${uniqueFailedPatterns[0]}`
          : 'Your solution did not pass all tests.',
    });

    trackChallengeAttempt(lesson._id, passed);

    setIsRunning(false);
  };

  const markComplete = () => {
    if (!canMarkComplete || isLessonCompleted) return;
    markLessonCompleted(courseSlug, lesson._id);
    trackLessonComplete(lesson._id, lesson.title, lesson.xpReward);
    setIsLessonCompleted(true);
  };

  const portableTextComponents: PortableTextComponents = {
    block: {
      normal: ({ children }) => (
        <p className="mb-4 leading-relaxed text-text-secondary">{children}</p>
      ),
      h2: ({ children }) => (
        <h2 className="mb-3 mt-8 text-2xl font-semibold text-text-primary">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-3 mt-6 text-xl font-semibold text-text-primary">{children}</h3>
      ),
      h4: ({ children }) => (
        <h4 className="mb-2 mt-5 text-lg font-semibold text-text-primary">{children}</h4>
      ),
      blockquote: ({ children }) => (
        <blockquote className="mb-4 rounded-r-lg border-l-4 border-accent-cyan/40 bg-surface p-3 text-text-secondary">
          {children}
        </blockquote>
      ),
    },
    marks: {
      code: ({ children }) => (
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-accent-cyan">
          {children}
        </code>
      ),
    },
    types: {
      codeBlock: ({ value }) => {
        const block = value as CodeBlockValue;
        const code = block.code ?? '';
        const lines = code.split('\n').length;
        const editorHeight = Math.min(Math.max(lines * 22 + 30, 120), 460);

        return (
          <div className="mb-5 overflow-hidden rounded-xl border border-border bg-surface-2">
            {block.filename && (
              <div className="border-b border-border px-3 py-2 text-xs text-text-muted">
                {block.filename}
              </div>
            )}
            <Editor
              height={editorHeight}
              value={code}
              theme="vs-dark"
              language={block.language ?? 'typescript'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                fontSize: 13,
                fontFamily: 'var(--font-jetbrains)',
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        );
      },
      callout: ({ value }) => {
        const callout = value as CalloutValue;
        const tone = callout.tone ?? 'info';

        const toneClasses: Record<
          NonNullable<CalloutValue['tone']>,
          { icon: ReactNode; className: string }
        > = {
          info: {
            icon: <Lightbulb size={16} aria-hidden className="text-accent-cyan" />,
            className: 'border-accent-cyan/35 bg-accent-cyan/10',
          },
          warning: {
            icon: <AlertTriangle size={16} aria-hidden className="text-xp" />,
            className: 'border-xp/35 bg-xp/10',
          },
          success: {
            icon: <CheckCircle2 size={16} aria-hidden className="text-accent-green" />,
            className: 'border-accent-green/35 bg-accent-green/10',
          },
          tip: {
            icon: <Lightbulb size={16} aria-hidden className="text-accent-purple" />,
            className: 'border-accent-purple/35 bg-accent-purple/10',
          },
        };

        const config = toneClasses[tone];

        return (
          <div className={cn('mb-4 rounded-xl border px-4 py-3', config.className)}>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{config.icon}</div>
              <p className="text-sm leading-relaxed text-text-secondary">{callout.text}</p>
            </div>
          </div>
        );
      },
      image: ({ value }) => {
        const imageValue = value as ImageBlockValue;
        if (!imageValue.asset) return null;

        return (
          <figure className="mb-5 overflow-hidden rounded-xl border border-border bg-surface">
            <Image
              src={urlFor(imageValue).width(1200).height(675).format('webp').url()}
              alt={imageValue.alt ?? 'Lesson image'}
              width={1200}
              height={675}
              className="h-auto w-full"
            />
            {imageValue.caption && (
              <figcaption className="border-t border-border px-3 py-2 text-center text-xs text-text-muted">
                {imageValue.caption}
              </figcaption>
            )}
          </figure>
        );
      },
    },
  };

  const panelState = outputPanelState(result);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {isChallenge && (
          <div className="mb-4 flex rounded-xl border border-border bg-surface p-1 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab('lesson')}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                mobileTab === 'lesson'
                  ? 'bg-accent-cyan/15 text-accent-cyan'
                  : 'text-text-secondary',
              )}
              aria-pressed={mobileTab === 'lesson'}
            >
              Lesson
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                mobileTab === 'editor'
                  ? 'bg-accent-cyan/15 text-accent-cyan'
                  : 'text-text-secondary',
              )}
              aria-pressed={mobileTab === 'editor'}
            >
              Code Editor
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <section className={cn(
            'space-y-5 lg:col-span-3',
            isChallenge && mobileTab === 'editor' && 'hidden lg:block',
          )}>
            <header className="rounded-2xl border border-border bg-surface p-5">
              <nav
                className="mb-3 flex items-center gap-2 text-xs text-text-muted"
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
                <Link
                  href={`/courses/${course.slug.current}`}
                  className="hover:text-text-primary transition-colors"
                >
                  {course.title}
                </Link>
                <ChevronRight aria-hidden size={14} />
                <span className="text-text-secondary">{lesson.title}</span>
              </nav>

              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
                {lesson.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    isChallenge
                      ? 'border-accent-cyan/35 bg-accent-cyan/10 text-accent-cyan'
                      : 'border-accent-green/35 bg-accent-green/10 text-accent-green',
                  )}
                >
                  {isChallenge ? 'Challenge' : 'Content'}
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                  {lesson.xpReward} XP
                </span>
              </div>
            </header>

            <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              {isChallenge ? (
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Challenge Description</h2>
                  {lesson.content && lesson.content.length > 0 ? (
                    <div className="mt-4">
                      <PortableText value={lesson.content} components={portableTextComponents} />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      Write a solution that satisfies all expected patterns and passes every test case.
                    </p>
                  )}

                  <h3 className="mt-6 text-lg font-semibold text-text-primary">Objectives</h3>
                  <ul className="mt-3 space-y-2">
                    {(lesson.expectedPatterns ?? []).map((pattern) => (
                      <li key={pattern} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle2 aria-hidden size={15} className="mt-0.5 shrink-0 text-accent-green" />
                        <span>Include pattern: <code className="font-mono text-xs text-accent-cyan">{pattern}</code></span>
                      </li>
                    ))}
                    {(lesson.expectedPatterns ?? []).length === 0 && (
                      <li className="text-sm text-text-muted">No explicit patterns configured.</li>
                    )}
                  </ul>

                  {(lesson.hints ?? []).length > 0 && (
                    <div className="mt-6 rounded-xl border border-border bg-background">
                      <button
                        type="button"
                        onClick={() => setShowHints((value) => !value)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary hover:bg-surface/70 focus:outline-none focus:ring-2 focus:ring-ring/60"
                        aria-expanded={showHints}
                      >
                        Hints
                        <ChevronRight
                          aria-hidden
                          size={16}
                          className={cn('transition-transform', showHints && 'rotate-90')}
                        />
                      </button>
                      {showHints && (
                        <ul className="space-y-2 border-t border-border px-4 py-3">
                          {(lesson.hints ?? []).map((hint, index) => (
                            <li key={`${hint}-${index}`} className="text-sm text-text-secondary">
                              {index + 1}. {hint}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <h3 className="mt-6 text-lg font-semibold text-text-primary">Test Cases</h3>
                  <div className="mt-3 space-y-2">
                    {challengeTestCases.length > 0 ? (
                      challengeTestCases.map((testCase) => (
                        <div
                          key={testCase.id ?? testCase.description}
                          className="rounded-lg border border-border bg-background px-3 py-2"
                        >
                          <p className="text-sm text-text-primary">{testCase.description}</p>
                          <p className="mt-1 text-xs text-text-muted">
                            Expected pattern: <span className="font-mono text-text-secondary">{testCase.expectedOutput}</span>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-text-muted">No test cases configured.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  {lesson.content && lesson.content.length > 0 ? (
                    <PortableText value={lesson.content} components={portableTextComponents} />
                  ) : (
                    <p className="text-sm text-text-secondary">
                      No content has been added for this lesson yet.
                    </p>
                  )}
                </div>
              )}
            </article>
          </section>

          {isChallenge && (
            <aside className={cn(
              'space-y-4 lg:col-span-2',
              mobileTab === 'lesson' && 'hidden lg:block',
            )}>
              <section className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold text-text-primary">Code Editor</h2>
                </div>
                <Editor
                  height="56vh"
                  language={lesson.codeLanguage ?? 'typescript'}
                  theme="vs-dark"
                  value={editorValue}
                  onChange={(value) => setEditorValue(value ?? '')}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontFamily: 'var(--font-jetbrains)',
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </section>

              <button
                ref={runButtonRef}
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-cyan px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-ring/60"
              >
                {isRunning ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play aria-hidden size={15} />
                    Run
                  </>
                )}
              </button>

              <section
                className={cn(
                  'rounded-xl border p-4',
                  panelState === 'neutral' && 'border-border bg-surface',
                  panelState === 'pass' && 'border-accent-green/35 bg-accent-green/10',
                  panelState === 'fail' && 'border-destructive/35 bg-destructive/10',
                )}
              >
                {panelState === 'neutral' && (
                  <p className="text-sm text-text-secondary">Run your code to see results.</p>
                )}
                {panelState === 'pass' && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 aria-hidden className="mt-0.5 text-accent-green" size={16} />
                    <p className="text-sm text-accent-green">All tests passed!</p>
                  </div>
                )}
                {panelState === 'fail' && (
                  <div className="flex items-start gap-2">
                    <XCircle aria-hidden className="mt-0.5 text-destructive" size={16} />
                    <p className="text-sm text-destructive">
                      {result?.failedPatterns.length
                        ? `Missing pattern: ${result?.failedPatterns[0]}`
                        : result?.message}
                    </p>
                  </div>
                )}
              </section>
            </aside>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {prevLesson ? (
              <Link
                href={`/courses/${course.slug.current}/lessons/${encodeURIComponent(prevLesson._id)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                <ChevronRight aria-hidden size={14} className="rotate-180" />
                Previous lesson
              </Link>
            ) : (
              <span className="text-sm text-text-muted">Start of course</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canMarkComplete ? (
              <button
                type="button"
                onClick={markComplete}
                disabled={isLessonCompleted}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring/60',
                  isLessonCompleted
                    ? 'cursor-not-allowed border border-accent-green/35 bg-accent-green/10 text-accent-green'
                    : 'bg-accent-green text-primary-foreground hover:opacity-90',
                )}
              >
                {isLessonCompleted ? 'Completed ✓' : 'Mark Complete'}
              </button>
            ) : (
              <span className="text-xs text-text-muted">
                {isChallenge
                  ? 'Pass the challenge to unlock completion.'
                  : 'Mark Complete unlocks after 30 seconds.'}
              </span>
            )}

            {nextLesson ? (
              <Link
                href={`/courses/${course.slug.current}/lessons/${encodeURIComponent(nextLesson._id)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Next lesson
                <ChevronRight aria-hidden size={14} />
              </Link>
            ) : (
              <Link
                href={`/courses/${course.slug.current}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Back to course
                <ChevronRight aria-hidden size={14} />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
              {isChallenge ? <Code2 aria-hidden size={13} /> : <BookOpen aria-hidden size={13} />}
              <span>{lesson.xpReward} XP to earn</span>
            </div>
            <div
              className="hidden items-center gap-1 text-xs text-text-muted xl:flex"
              title="Keyboard shortcuts"
            >
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">Alt+←</kbd>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">Alt+→</kbd>
              {isChallenge && (
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">Alt+↵</kbd>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
