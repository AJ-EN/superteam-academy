import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'default' | 'white' | 'muted';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

const colorClasses: Record<SpinnerColor, string> = {
  default: 'border-accent-cyan border-t-transparent',
  white: 'border-white border-t-transparent',
  muted: 'border-text-muted border-t-transparent',
};

export function LoadingSpinner({
  size = 'md',
  color = 'default',
  className,
  label = 'Loading…',
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
    />
  );
}
