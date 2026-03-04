'use client';

import { createElement, useEffect, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

let initialized = false;

function shouldTrack(): boolean {
  return typeof window !== 'undefined' && Boolean(POSTHOG_KEY);
}

export function initAnalytics(): void {
  if (!shouldTrack() || initialized) return;

  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    autocapture: true,
    persistence: 'localStorage+cookie',
  });

  initialized = true;
}

function capture(event: string, properties?: Record<string, unknown>): void {
  if (!shouldTrack()) return;
  posthog.capture(event, properties);
}

export function trackCourseEnroll(courseSlug: string, courseTitle: string): void {
  capture('course_enroll', { courseSlug, courseTitle });
}

export function trackLessonComplete(
  lessonId: string,
  lessonTitle: string,
  xpEarned: number,
): void {
  capture('lesson_complete', { lessonId, lessonTitle, xpEarned });
}

export function trackChallengeAttempt(lessonId: string, passed: boolean): void {
  capture('challenge_attempt', { lessonId, passed });
}

export function trackWalletConnect(walletType: string): void {
  capture('wallet_connect', { walletType });
}

export function trackLeaderboardView(timeframe: string): void {
  capture('leaderboard_view', { timeframe });
}

export function trackCredentialView(credentialId: string): void {
  capture('credential_view', { credentialId });
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!shouldTrack()) return;
    capture('$pageview', {
      pathname,
      search: searchParams.toString(),
      url: `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    });
  }, [pathname, searchParams]);

  return createElement(PostHogProvider, { client: posthog }, children);
}
