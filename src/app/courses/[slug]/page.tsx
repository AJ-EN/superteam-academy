import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CourseDetail } from '@/components/sections/course-detail';
import { getAllCourses, getCourseBySlug } from '@/sanity/lib/queries';

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const courses = await getAllCourses();
  return courses.map((course) => ({
    slug: course.slug.current,
  }));
}

export async function generateMetadata(
  { params }: CoursePageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course || !course.isPublished) {
    return {
      title: 'Course Not Found | Superteam Academy',
    };
  }

  return {
    title: `${course.title} | Superteam Academy`,
    description: course.description ?? `Start learning ${course.title} on Superteam Academy.`,
  };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course || !course.isPublished) {
    notFound();
  }

  return <CourseDetail course={course} />;
}
