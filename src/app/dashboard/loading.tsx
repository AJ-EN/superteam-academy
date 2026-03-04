export default function DashboardLoading() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-16 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="mt-6 h-96 animate-pulse rounded-2xl border border-border bg-surface" />
      </section>
    </main>
  );
}
