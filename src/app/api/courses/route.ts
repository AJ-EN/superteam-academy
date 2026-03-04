import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses, getFeaturedCourses } from '@/sanity/lib/queries';

export async function GET(request: NextRequest) {
  try {
    const featuredParam = request.nextUrl.searchParams.get('featured');
    const featured = featuredParam === '1' || featuredParam === 'true';

    const courses = featured
      ? await getFeaturedCourses()
      : await getAllCourses();

    return NextResponse.json({ courses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch courses.';
    return NextResponse.json(
      { error: message, courses: [] },
      { status: 500 },
    );
  }
}
