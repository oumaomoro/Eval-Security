import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-config";

import { useWorkspace } from "@/hooks/use-workspace";

export function useComplianceAudits() {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: [api.compliance.list.path, activeWorkspaceId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.compliance.list.path), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch audits");
      return api.compliance.list.responses[200].parse(await res.json());
    },
  });
}

export function useRunAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { scope: { contractIds: number[]; standards: string[]; categories: string[] } }) => {      const res = await fetch(getApiUrl(api.compliance.run.path), {
        method: api.compliance.run.method,
        headers: { 
          "Content-Type": "application/json",
        },
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

export function useRemediationSuggestions() {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: [api.compliance.suggestions.list.path, activeWorkspaceId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.compliance.suggestions.list.path), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    },
  });
}

export function useAcceptRemediation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const path = buildUrl(api.compliance.suggestions.accept.path, { id });
      const res = await fetch(getApiUrl(path), {
        method: api.compliance.suggestions.accept.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to accept suggestion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.compliance.suggestions.list.path] });
      toast({ title: "Remediation Accepted", description: "The compliance fix has been applied." });
    },
  });
}

export function useDismissRemediation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const path = buildUrl(api.compliance.suggestions.dismiss.path, { id });
      const res = await fetch(getApiUrl(path), {
        method: api.compliance.suggestions.dismiss.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to dismiss suggestion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.compliance.suggestions.list.path] });
      toast({ title: "Suggestion Dismissed", description: "The suggestion will no longer appear." });
    },
  });
}
