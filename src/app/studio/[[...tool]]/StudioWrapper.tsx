'use client';

import dynamic from 'next/dynamic';

// styled-components (peer dep of @sanity/ui) crashes Turbopack's SSR module
// evaluator. Loading the Studio client-side only avoids the issue.
const StudioClient = dynamic(() => import('./StudioClient'), { ssr: false });

export function StudioWrapper() {
  return <StudioClient />;
}
