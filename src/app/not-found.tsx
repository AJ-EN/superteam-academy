import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(0,212,255,0.25), transparent 40%), radial-gradient(circle at 80% 10%, rgba(139,92,246,0.22), transparent 35%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.15), transparent 45%)',
          animation: 'pulse 7s ease-in-out infinite',
        }}
      />

      <section className="relative z-10 w-full max-w-xl rounded-3xl border border-border bg-background/80 p-8 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-text-muted">404</p>
        <h1 className="mt-3 text-3xl font-bold text-text-primary sm:text-4xl">
          404 — Page Not Found
        </h1>
        <p className="mt-3 text-sm text-text-secondary sm:text-base">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-accent-cyan px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Go Home
          </Link>
          <Link
            href="/courses"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary"
          >
            Browse Courses
          </Link>
        </div>
      </section>
    </main>
  );
}
