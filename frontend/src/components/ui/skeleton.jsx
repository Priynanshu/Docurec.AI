


import { cn } from '../../utils/cn';




function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(

        'animate-pulse rounded-md bg-bg-elevated',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
