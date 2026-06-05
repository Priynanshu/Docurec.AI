// ─── shadcn/ui Skeleton Component ────────────────────────────────────────────
// This is the official shadcn/ui Skeleton — shimmer loading placeholder

import { cn } from '../../utils/cn';

// Usage: <Skeleton className="h-4 w-full" />
// className controls size — just add h-X w-X Tailwind classes

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        // Base shimmer animation
        'animate-pulse rounded-md bg-bg-elevated',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
