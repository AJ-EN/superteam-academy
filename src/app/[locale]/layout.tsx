import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from '@/components/layout/navbar';
import { routing } from '@/i18n/routing';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://academy.superteam.fun';

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Superteam Academy',
    template: '%s | Superteam Academy',
  },
  description: 'Learn Solana development. Earn on-chain credentials.',
  openGraph: {
    type: 'website',
    siteName: 'Superteam Academy',
    title: 'Superteam Academy',
    description: 'Learn Solana development. Earn on-chain credentials.',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@SuperteamBR',
    title: 'Superteam Academy',
    description: 'Learn Solana development. Earn on-chain credentials.',
    images: ['/og-default.png'],
  },
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>
      </div>
      <SpeedInsights />
      <Analytics />
    </NextIntlClientProvider>
  );
}
