import { cn } from "@/lib/cn";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Signal lost",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-start justify-center gap-2 border border-dashed border-[var(--danger)] bg-[var(--danger-soft)] p-5",
        className
      )}
    >
      <span
        className="kbd"
        style={{ color: "var(--danger)" }}
      >
        ERR · {title}
      </span>
      {message && (
        <p className="text-[13px] text-[var(--fg)] leading-snug">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mono mt-2 border border-[var(--danger)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-[var(--bg)]"
        >
          Retry
        </button>
      )}
    </div>
  );
}
