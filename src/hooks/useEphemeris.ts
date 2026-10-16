"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useEphemeris(caseId: string | undefined) {
  const enabled = !!caseId && caseId !== "all";
  return useQuery({
    queryKey: ["ephemeris", caseId],
    queryFn: () => api.getEphemeris(caseId as string),
    enabled,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });
}
