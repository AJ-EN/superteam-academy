import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';
import { CourseCatalog } from '@/components/sections/course-catalog';
import { getAllCourses } from '@/sanity/lib/queries';

export const metadata: Metadata = {
  title: 'Courses | Superteam Academy',
  description: 'Browse all published learning tracks and courses on Superteam Academy.',
};

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <main className="flex-1">
      <CourseCatalog courses={courses} />
      <Footer />
    </main>
  );
}
