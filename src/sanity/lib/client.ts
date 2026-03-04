import { createClient, type SanityClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = '2024-01-01';

/**
 * Browser-safe Sanity client.
 *
 * - `useCdn: true` — reads from the Sanity CDN (fast, eventually consistent).
 * - No token — only reads public, published content.
 * - Safe to import in Client Components and Server Components alike.
 */
export const sanityClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

/**
 * Privileged server-side Sanity client.
 *
 * - `useCdn: false` — always reads from the primary API (strongly consistent).
 * - Uses `SANITY_API_TOKEN` for write access and draft content.
 * - ⚠️ NEVER import this in Client Components — the token would leak to the browser.
 *   Use only in API routes, Server Actions, or Next.js Server Components.
 */
export const serverClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  perspective: 'published',
});
