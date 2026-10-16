import { cn } from "@/lib/cn";

type DotStatus = "phos" | "go" | "warn" | "danger" | "info" | "idle";

const COLOR: Record<DotStatus, string> = {
  phos: "var(--phos)",
  go: "var(--go)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  info: "var(--info)",
  idle: "var(--fg-faint)",
};

interface StatusDotProps {
  status?: DotStatus;
  pulse?: boolean;
  size?: number;
  className?: string;
}

export function StatusDot({
  status = "phos",
  pulse = false,
  size = 8,
  className,
}: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block rounded-full", pulse && "pulse-phos", className)}
      style={{
        width: size,
        height: size,
        background: COLOR[status],
      }}
    />
  );
}
