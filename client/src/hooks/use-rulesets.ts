import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";

export function useRulesets() {
  return useQuery({
    queryKey: [api.auditRulesets.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("costloci_token");
      const res = await fetch(getApiUrl(api.auditRulesets.list.path), { 
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch rulesets");
      return res.json();
    },
  });
}

export function useCreateRuleset() {
  return useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("costloci_token");
      const res = await fetch(getApiUrl(api.auditRulesets.create.path), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create ruleset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auditRulesets.list.path] });
    }
  });
}
