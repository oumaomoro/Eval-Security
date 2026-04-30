import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Risk, type InsertRisk } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api-client";
import { useWorkspace } from "@/hooks/use-workspace";

export function useRisks(filters?: { contractId?: string }) {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery<Risk[]>({
    queryKey: [api.risks.list.path, filters, activeWorkspaceId],
    queryFn: async () => {
      const url = filters?.contractId 
        ? `${api.risks.list.path}?contractId=${filters.contractId}`
        : api.risks.list.path;
      
      const res = await fetchApi(url);
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
      const res = await fetchApi(api.risks.create.path, {
        method: api.risks.create.method,
        body: JSON.stringify(data),
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
      const url = buildUrl(api.risks.mitigate.path, { id });
      const res = await fetchApi(url, {
        method: api.risks.mitigate.method,
        body: JSON.stringify({ status, strategy }),
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
