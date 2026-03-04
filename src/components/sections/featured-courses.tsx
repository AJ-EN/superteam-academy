import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CourseCard } from '@/components/ui/course-card';
import { urlFor } from '@/sanity/lib/image';
import type { SanityCourseSummary } from '@/sanity/lib/queries';

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="h-44 bg-surface-2" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-surface-2 rounded-md w-3/4" />
        <div className="h-3 bg-surface-2 rounded-md w-full" />
        <div className="h-3 bg-surface-2 rounded-md w-5/6" />
        <div className="flex gap-2 mt-1">
          <div className="h-5 w-16 bg-surface-2 rounded-full" />
          <div className="h-5 w-12 bg-surface-2 rounded-full" />
        </div>
        <div className="h-px bg-border mt-1" />
        <div className="flex justify-between">
          <div className="h-3 bg-surface-2 rounded-md w-1/3" />
          <div className="h-3 bg-surface-2 rounded-md w-1/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface FeaturedCoursesProps {
  courses: SanityCourseSummary[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
  const hasCourses = courses.length > 0;

  return (
    <section className="py-24 px-6 bg-surface-2/30">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-cyan mb-3">
              Curated Content
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
              Featured Courses
            </h2>
            <p className="text-text-secondary mt-2">
              Hand-picked by the Superteam Brazil community
            </p>
          </div>
          <Link
            href="/courses"
            className="self-start sm:self-auto flex items-center gap-1.5 text-sm font-medium text-accent-cyan hover:text-accent-cyan/70 transition-colors shrink-0"
          >
            View all courses <ArrowRight size={15} />
          </Link>
        </div>

        {/* Course grid — horizontal scroll on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hasCourses
            ? courses.map((course) => (
                <CourseCard
                  key={course._id}
                  title={course.title}
                  description={course.description ?? ''}
                  thumbnailUrl={
                    course.thumbnail
                      ? urlFor(course.thumbnail).width(640).height(360).format('webp').url()
                      : null
                  }
                  difficulty={course.difficulty}
                  xpReward={course.xpReward}
                  estimatedHours={course.duration ?? 0}
                  slug={course.slug.current}
                  tags={[course.language, course.track.replace('-', ' ')].filter(Boolean)}
                />
              ))
            : Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        </div>

        {/* Mobile CTA */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-accent-cyan/40 text-sm font-medium transition-colors"
          >
            View All Courses <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
