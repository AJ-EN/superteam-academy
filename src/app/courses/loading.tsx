export default function CoursesLoading() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-56 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-80 animate-pulse rounded bg-surface-2" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="h-10 w-full animate-pulse rounded-xl bg-surface-2" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 9 }, (_, index) => (
                <div key={index} className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 h-14 animate-pulse rounded-2xl border border-border bg-surface" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <div className="h-44 animate-pulse bg-surface-2" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
                    <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
