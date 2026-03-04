import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LessonView, type LessonNavItem } from '@/components/sections/lesson-view';
import { getCourseBySlug, getLessonById } from '@/sanity/lib/queries';

interface LessonPageProps {
  params: Promise<{
    slug: string;
    lessonId: string;
  }>;
}

function flattenLessons(course: NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>) {
  return [...course.modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((module) =>
      [...module.lessons]
        .sort((a, b) => a.order - b.order),
    );
}

function navItemFromLesson(
  lesson: ReturnType<typeof flattenLessons>[number] | undefined,
): LessonNavItem | null {
  if (!lesson) return null;
  return {
    _id: lesson._id,
    title: lesson.title,
    type: lesson.type,
    xpReward: lesson.xpReward,
  };
}

export async function generateMetadata(
  { params }: LessonPageProps,
): Promise<Metadata> {
  const { slug, lessonId } = await params;
  const decodedLessonId = decodeURIComponent(lessonId);

  const [course, lesson] = await Promise.all([
    getCourseBySlug(slug),
    getLessonById(decodedLessonId),
  ]);

  if (!course || !course.isPublished || !lesson) {
    return {
      title: 'Lesson Not Found | Superteam Academy',
    };
  }

  return {
    title: `${lesson.title} | ${course.title} | Superteam Academy`,
    description:
      lesson.type === 'challenge'
        ? `Complete "${lesson.title}" challenge in ${course.title}.`
        : `Study "${lesson.title}" from ${course.title}.`,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;
  const decodedLessonId = decodeURIComponent(lessonId);

  const [course, lesson] = await Promise.all([
    getCourseBySlug(slug),
    getLessonById(decodedLessonId),
  ]);

  if (!course || !course.isPublished || !lesson) {
    notFound();
  }

  const flatLessons = flattenLessons(course);
  const lessonIndex = flatLessons.findIndex((item) => item._id === lesson._id);

  if (lessonIndex === -1) {
    notFound();
  }

  const prevLesson = navItemFromLesson(flatLessons[lessonIndex - 1]);
  const nextLesson = navItemFromLesson(flatLessons[lessonIndex + 1]);

  return (
    <LessonView
      key={lesson._id}
      lesson={lesson}
      course={course}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
    />
  );
}
