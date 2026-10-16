"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/shared/LoadingState";

export const CoverageMap = dynamic(() => import("./CoverageMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-sunk)]">
      <LoadingState message="Loading map…" />
    </div>
  ),
});
