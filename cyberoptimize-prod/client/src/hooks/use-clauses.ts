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
  });
}

export function useGenerateClause() {
  return useMutation({
    mutationFn: async (data: { category: string; requirements: string; jurisdiction?: string }) => {
      const res = await fetch(api.clauses.generate.path, {
        method: api.clauses.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate clause");
      return api.clauses.generate.responses[200].parse(await res.json());
    },
  });
}
