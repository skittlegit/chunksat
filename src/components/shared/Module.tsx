import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ModuleVariant = "default" | "live" | "on";

interface ModuleProps {
  /** Eyebrow caption shown in mono caps. */
  label?: string;
  /** Tiny side-tag rendered to the right of the label (e.g. coordinate or count). */
  tag?: ReactNode;
  /** Right-side header actions. */
  actions?: ReactNode;
  /** Sub-caption rendered under the label, sans, italic. */
  hint?: string;
  /** Visual emphasis. `live` = subtle phosphor edge; `on` = full phosphor edge + brighter border. */
  variant?: ModuleVariant;
  /** Hide the header. */
  bare?: boolean;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

/**
 * A single panel of the lab dashboard. Hairline border, optional phosphor
 * top-rule, and a typographic header with eyebrow + tag.
 */
export function Module({
  label,
  tag,
  actions,
  hint,
  variant = "default",
  bare = false,
  className,
  contentClassName,
  children,
}: ModuleProps) {
  return (
    <section
      className={cn(
        "module relative flex flex-col",
        variant === "live" && "module-live",
        variant === "on" && "module-on",
        className
      )}
    >
      {!bare && (label || tag || actions || hint) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:gap-4 sm:px-5">
          <div className="flex min-w-0 items-baseline gap-3">
            {label && <span className="eyebrow">{label}</span>}
            {tag && (
              <span className="kbd tabular-nums text-[var(--fg-faint)]">{tag}</span>
            )}
            {hint && (
              <span className="hidden truncate text-[12px] italic text-[var(--fg-mute)] md:inline">
                {hint}
              </span>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
      )}
      <div className={cn("flex-1 p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}
