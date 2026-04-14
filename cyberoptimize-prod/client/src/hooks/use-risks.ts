import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertRisk } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-config";

export function useRisks(filters?: { contractId?: string }) {
  return useQuery({
    queryKey: [api.risks.list.path, filters],
    queryFn: async () => {
      const token = localStorage.getItem("costloci_token");
      const url = filters?.contractId 
        ? `${api.risks.list.path}?contractId=${filters.contractId}`
        : api.risks.list.path;
      
      const res = await fetch(getApiUrl(url), { 
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch risks");
      return api.risks.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRisk() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertRisk) => {
      const res = await fetch(api.risks.create.path, {
        method: api.risks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create risk");
      return api.risks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.risks.list.path] });
      toast({ title: "Risk Added", description: "New risk has been registered." });
    },
  });
}

export function useMitigateRisk() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, strategy }: { id: number; status: string; strategy?: string }) => {
      const token = localStorage.getItem("costloci_token");
      const url = buildUrl(api.risks.mitigate.path, { id });
      const res = await fetch(getApiUrl(url), {
        method: api.risks.mitigate.method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, strategy }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mitigate risk");
      return api.risks.mitigate.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.risks.list.path] });
      toast({ title: "Risk Updated", description: "Mitigation status updated." });
    },
  });
}
