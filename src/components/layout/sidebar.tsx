'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  PlayCircle,
  ChevronDown,
  BookOpen,
  Code,
  Video,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course, Lesson, LessonType, Module } from '@/types';

const lessonTypeIcon: Record<LessonType, React.ElementType> = {
  reading: BookOpen,
  video: Video,
  quiz: HelpCircle,
  coding: Code,
};

// ─── Lesson row ───────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: Lesson;
  isCurrent: boolean;
  isCompleted: boolean;
  onSelect?: (lesson: Lesson) => void;
}

function LessonRow({ lesson, isCurrent, isCompleted, onSelect }: LessonRowProps) {
  const TypeIcon = lessonTypeIcon[lesson.type];

  return (
    <button
      onClick={() => onSelect?.(lesson)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors',
        isCurrent
          ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
          : isCompleted
          ? 'text-text-secondary hover:bg-surface-2'
          : 'text-text-muted hover:bg-surface-2 hover:text-text-secondary',
      )}
    >
      {isCompleted ? (
        <CheckCircle size={15} className="text-accent-green shrink-0" />
      ) : isCurrent ? (
        <PlayCircle size={15} className="text-accent-cyan shrink-0" />
      ) : (
        <TypeIcon size={15} className="shrink-0" />
      )}
      <span className="flex-1 line-clamp-1 text-xs leading-snug">
        {lesson.title}
      </span>
      <span className="shrink-0 text-xs text-text-muted font-mono">
        {lesson.estimatedMinutes}m
      </span>
    </button>
  );
}

// ─── Module accordion ─────────────────────────────────────────────────────────

interface ModuleAccordionProps {
  module: Module;
  currentLessonId?: string;
  completedLessonIds: Set<string>;
  onLessonSelect?: (lesson: Lesson) => void;
  defaultOpen?: boolean;
}

function ModuleAccordion({
  module,
  currentLessonId,
  completedLessonIds,
  onLessonSelect,
  defaultOpen = false,
}: ModuleAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const completedCount = module.lessons.filter((l) =>
    completedLessonIds.has(l.id),
  ).length;
  const pct =
    module.lessons.length > 0
      ? (completedCount / module.lessons.length) * 100
      : 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-surface hover:bg-surface-2 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-primary line-clamp-1">
            {module.title}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {completedCount}/{module.lessons.length} lessons
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Mini progress */}
          <div className="w-10 h-1 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-purple transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ChevronDown
            size={15}
            className={cn(
              'text-text-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-2 flex flex-col gap-1 bg-surface-2/40">
              {module.lessons
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    isCurrent={lesson.id === currentLessonId}
                    isCompleted={completedLessonIds.has(lesson.id)}
                    onSelect={onLessonSelect}
                  />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  course: Course;
  currentLessonId?: string;
  completedLessonIds?: Set<string>;
  onLessonSelect?: (lesson: Lesson) => void;
  className?: string;
}

export function Sidebar({
  course,
  currentLessonId,
  completedLessonIds = new Set(),
  onLessonSelect,
  className,
}: SidebarProps) {
  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0,
  );
  const completedCount = completedLessonIds.size;
  const overallPct =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 w-72 shrink-0 p-4 border-r border-border bg-surface min-h-screen overflow-y-auto',
        className,
      )}
    >
      {/* Course header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-sm font-bold text-text-primary line-clamp-2 leading-snug mb-2.5">
          {course.title}
        </h2>
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span>
            {completedCount}/{totalLessons} lessons
          </span>
          <span>{Math.round(overallPct)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Module accordions */}
      <div className="flex flex-col gap-2">
        {course.modules
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((module, idx) => {
            const hasCurrentLesson = module.lessons.some(
              (l) => l.id === currentLessonId,
            );
            return (
              <ModuleAccordion
                key={module.id}
                module={module}
                currentLessonId={currentLessonId}
                completedLessonIds={completedLessonIds}
                onLessonSelect={onLessonSelect}
                defaultOpen={hasCurrentLesson || idx === 0}
              />
            );
          })}
      </div>
    </aside>
  );
}
