"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: api.getCases,
    staleTime: Infinity,
  });
}
