import type { Metadata } from 'next';
import { getFeaturedCourses } from '@/sanity/lib/queries';
import { Hero } from '@/components/sections/hero';
import { HowItWorks } from '@/components/sections/how-it-works';
import { LearningPaths } from '@/components/sections/learning-paths';
import { FeaturedCourses } from '@/components/sections/featured-courses';
import { CredentialShowcase } from '@/components/sections/credential-showcase';
import { SocialProof } from '@/components/sections/social-proof';
import { CTABanner } from '@/components/sections/cta-banner';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Superteam Academy — Learn Solana Development',
  description:
    'Master Solana development through hands-on challenges, earn XP, and collect on-chain credentials that prove your skills.',
  openGraph: {
    title: 'Superteam Academy — Learn Solana Development',
    description:
      'Master Solana development through hands-on challenges, earn XP, and collect on-chain credentials that prove your skills.',
    images: [{ url: '/og-home.png', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'Superteam Academy — Learn Solana Development',
    description:
      'Master Solana development through hands-on challenges, earn XP, and collect on-chain credentials that prove your skills.',
    images: ['/og-home.png'],
  },
};

export default async function LocalizedHomePage() {
  const courses = await getFeaturedCourses().catch(() => []);

  return (
    <main>
      <Hero />
      <HowItWorks />
      <LearningPaths />
      <FeaturedCourses courses={courses} />
      <CredentialShowcase />
      <SocialProof />
      <CTABanner />
      <Footer />
    </main>
  );
}
