"use client";

import { Loader2, Play } from "lucide-react";
import { cn } from "@/lib/cn";

interface RunButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  loadingLabel?: string;
  className?: string;
  size?: "sm" | "md";
}

export function RunButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Initiate Pass",
  loadingLabel = "Computing",
  className,
  size = "md",
}: RunButtonProps) {
  const idle = !loading && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "group relative inline-flex items-center gap-2.5 border transition-colors",
        size === "md" ? "h-10 px-5" : "h-8 px-3.5",
        idle
          ? "border-[var(--phos)] bg-[var(--phos)] text-[var(--bg)] hover:bg-[var(--phos-deep)] hover:border-[var(--phos-deep)]"
          : "cursor-not-allowed border-[var(--line)] bg-transparent text-[var(--fg-faint)]",
        className
      )}
      style={{ borderRadius: 2 }}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Play size={11} fill="currentColor" />
      )}
      <span
        className="mono text-[10px] font-medium uppercase tracking-[0.22em]"
      >
        {loading ? loadingLabel : label}
      </span>
    </button>
  );
}
