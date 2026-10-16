import { cn } from "@/lib/cn";

interface DataReadoutProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  align?: "left" | "right";
  emphasis?: boolean;
  className?: string;
}

/** A small "label / numeric value / unit" row, left- or right-aligned. */
export function DataReadout({
  label,
  value,
  unit,
  align = "left",
  emphasis = false,
  className,
}: DataReadoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5",
        align === "right" && "items-end text-right",
        className
      )}
    >
      <span className="kbd">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "numeric leading-none",
            emphasis ? "text-[var(--phos)]" : "text-[var(--fg)]"
          )}
          style={{ fontSize: emphasis ? 28 : 20 }}
        >
          {value}
        </span>
        {unit && (
          <span className="mono text-[10px] tracking-[0.12em] text-[var(--fg-faint)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
