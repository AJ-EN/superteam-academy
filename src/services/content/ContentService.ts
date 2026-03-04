import type { SanityCourseSummary } from '@/sanity/lib/queries';

interface CoursesResponse {
  courses: SanityCourseSummary[];
  error?: string;
}

export class ContentService {
  async getAllCourses(): Promise<SanityCourseSummary[]> {
    return this.fetchCourses({ featured: false });
  }

  async getFeaturedCourses(): Promise<SanityCourseSummary[]> {
    return this.fetchCourses({ featured: true });
  }

  private async fetchCourses(options: { featured: boolean }): Promise<SanityCourseSummary[]> {
    const params = new URLSearchParams();
    if (options.featured) params.set('featured', 'true');

    const response = await fetch(
      `/api/courses${params.toString() ? `?${params.toString()}` : ''}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error(`ContentService: failed to fetch courses (${response.status}).`);
    }

    const json = (await response.json()) as CoursesResponse;
    return json.courses;
  }
}
