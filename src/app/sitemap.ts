import type { MetadataRoute } from 'next';
import { getAllCourses } from '@/sanity/lib/queries';
import { routing } from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://academy.superteam.fun';

const STATIC_ROUTES = ['', '/courses', '/leaderboard'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getAllCourses().catch(() => []);

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    STATIC_ROUTES.map((route) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? ('weekly' as const) : ('monthly' as const),
      priority: route === '' ? 1 : 0.8,
    })),
  );

  const courseEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    courses.map((course) => ({
      url: `${BASE_URL}/${locale}/courses/${course.slug.current}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  );

  return [...staticEntries, ...courseEntries];
}
