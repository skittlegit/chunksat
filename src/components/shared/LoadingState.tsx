import { cn } from "@/lib/cn";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Listening…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--fg-mute)]",
        className
      )}
    >
      <div className="relative h-[1px] w-32 overflow-hidden bg-[var(--line)]">
        <span
          aria-hidden
          className="absolute inset-y-0 w-1/3 bg-[var(--phos)] scan-sweep"
        />
      </div>
      <span className="kbd">{message}</span>
    </div>
  );
}
