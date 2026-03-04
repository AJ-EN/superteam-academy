/**
 * Sanity Studio route — accessible at /studio
 *
 * ⚠️  SECURITY: This page renders the full CMS Studio.
 *   In production, protect this route with Clerk/Auth.js middleware,
 *   or restrict via Vercel deployment protections / IP allowlist.
 *   For development, it is always accessible.
 *
 * The `metadata` and `viewport` exports ensure the Studio renders correctly
 * (removes the default noindex / mobile viewport that Next.js sets).
 */

import { StudioWrapper } from './StudioWrapper';

export { metadata, viewport } from 'next-sanity/studio';

export default function StudioPage() {
  return <StudioWrapper />;
}
