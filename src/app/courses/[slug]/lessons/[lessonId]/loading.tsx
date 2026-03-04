export default function LessonLoading() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
            <div className="h-[55vh] animate-pulse rounded-2xl border border-border bg-surface" />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <div className="h-[56vh] animate-pulse rounded-2xl border border-border bg-surface" />
            <div className="h-12 animate-pulse rounded-xl bg-surface-2" />
            <div className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
          </div>
        </div>
      </div>
    </main>
  );
}
