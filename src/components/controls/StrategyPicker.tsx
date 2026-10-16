"use client";

import { useAppStore } from "@/store/useAppStore";
import { STRATEGIES } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function StrategyPicker() {
  const strategy = useAppStore((s) => s.strategy);
  const setStrategy = useAppStore((s) => s.setStrategy);

  return (
    <div className="grid grid-cols-1 gap-2">
      {STRATEGIES.map((s, i) => {
        const active = strategy === s.id;
        const experimental = s.id !== "boustrophedon";
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setStrategy(s.id)}
            aria-pressed={active}
            className={cn(
              "group flex items-start gap-3 border px-3.5 py-3 text-left transition-colors",
              active
                ? "border-[var(--phos)] bg-[var(--phos-soft)]"
                : "border-[var(--line)] bg-[var(--bg-sunk)] hover:border-[var(--line-bright)] hover:bg-[var(--bg-lift)]"
            )}
            style={{ borderRadius: 2 }}
          >
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
                active
                  ? "border-[var(--phos)] bg-[var(--phos)]"
                  : "border-[var(--line-bright)] bg-transparent group-hover:border-[var(--fg-mute)]"
              )}
            >
              {active && (
                <span
                  className="block h-1.5 w-1.5"
                  style={{ background: "var(--bg)" }}
                  aria-hidden
                />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "display text-[14px]",
                    active ? "text-[var(--fg)]" : "text-[var(--fg)]"
                  )}
                >
                  {s.label}
                </span>
                <div className="flex items-baseline gap-2">
                  {experimental && (
                    <span
                      className="mono text-[8px] uppercase tracking-[0.18em]"
                      style={{ color: "#d04a4a" }}
                    >
                      experimental
                    </span>
                  )}
                  <span
                    className="kbd tabular-nums"
                    style={{
                      color: active ? "var(--phos)" : "var(--fg-faint)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <span className="text-[12px] leading-snug text-[var(--fg-mute)]">
                {s.hint}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
