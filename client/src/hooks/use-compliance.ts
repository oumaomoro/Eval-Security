import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useComplianceAudits() {
  return useQuery({
    queryKey: [api.compliance.list.path],
    queryFn: async () => {
      const res = await fetch(api.compliance.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audits");
      return api.compliance.list.responses[200].parse(await res.json());
    },
  });
}

export function useRunAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { scope: { contractIds: number[]; standards: string[] } }) => {
      const res = await fetch(api.compliance.run.path, {
        method: api.compliance.run.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start audit");
      return api.compliance.run.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.compliance.list.path] });
      toast({ title: "Audit Started", description: "Compliance audit is running in the background." });
    },
  });
}
