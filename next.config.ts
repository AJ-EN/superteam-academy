import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Sanity Studio uses some packages that need transpiling for the App Router.
  transpilePackages: ['next-sanity'],

  // styled-components (peer dep of @sanity/ui used by Sanity Studio) crashes
  // Turbopack's SSR module evaluator. Mark it external so it is loaded via
  // Node's require() instead of being bundled.
  serverExternalPackages: ['styled-components'],

  images: {
    // Allow Next.js <Image> to serve optimised images from Sanity's CDN.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
