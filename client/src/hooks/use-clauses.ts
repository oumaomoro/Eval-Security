import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useClauses() {
  return useQuery({
    queryKey: [api.clauses.list.path],
    queryFn: async () => {
      const res = await fetch(api.clauses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clauses");
      return api.clauses.list.responses[200].parse(await res.json());
    },
    staleTime: 3600000, // 1 hour caching
  });
}

export function useGenerateClause() {
  return useMutation({
    mutationFn: async (data: { category: string; requirements: string; standards?: string[]; risks?: string[]; tone?: string }) => {
      const res = await fetch("/api/intelligence/generate-clause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate clause");
      return await res.json();
    },
  });
}

export function useCompareClauses() {
  return useMutation({
    mutationFn: async (data: { contractClauseId?: number; libraryClauseId: number; contractText?: string }) => {
      const res = await fetch("/api/intelligence/compare-clauses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to compare clauses");
      return await res.json();
    },
  });
}
