import { cn } from '@/lib/utils';

// ─── Editor ───────────────────────────────────────────────────────────────────

export function EditorSkeleton({ height = '56vh' }: { height?: string | number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-surface-2"
      style={{ height }}
      aria-hidden
    >
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-border"
            style={{ width: `${60 + (i % 3) * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="h-48 w-48 animate-pulse rounded-full bg-surface-2" aria-hidden />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface overflow-hidden animate-pulse',
        className,
      )}
      aria-hidden
    >
      <div className="h-44 bg-surface-2" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-surface-2" />
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-3 w-5/6 rounded bg-surface-2" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 rounded-full bg-surface-2" />
          <div className="h-5 w-12 rounded-full bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

export function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-surface p-3 animate-pulse',
        className,
      )}
      aria-hidden
    >
      <div className="h-8 w-8 rounded-full bg-surface-2 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 rounded bg-surface-2" />
        <div className="h-2.5 w-20 rounded bg-surface-2" />
      </div>
      <div className="h-4 w-16 rounded bg-surface-2" />
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      {/* Header */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-full bg-surface-2 shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-6 w-48 rounded bg-surface-2" />
            <div className="h-4 w-32 rounded bg-surface-2" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-surface-2" />
              <div className="h-6 w-20 rounded-full bg-surface-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-surface-2" />
            <div className="h-7 w-12 rounded bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Achievements grid */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="h-5 w-36 rounded bg-surface-2 mb-4" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-14 w-14 rounded-xl bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
