export default function CourseDetailLoading() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="h-4 w-60 animate-pulse rounded bg-surface-2" />
              <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-2" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-surface-2" />
            </div>
            <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />
            <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" />
          </div>
          <div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" />
        </div>
      </section>
    </main>
  );
}
