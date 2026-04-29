import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertContract } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-config";

import { useWorkspace } from "@/hooks/use-workspace";

export function useContracts(filters?: { clientId?: string; status?: string }) {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: [api.contracts.list.path, activeWorkspaceId, filters],
    queryFn: async () => {
      const url = filters 
        ? `${api.contracts.list.path}?${new URLSearchParams(filters as any).toString()}`
        : api.contracts.list.path;
      
      const res = await fetch(getApiUrl(url), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return api.contracts.list.responses[200].parse(await res.json());
    },
    refetchInterval: (query) => {
      // If there are pending contracts, poll every 3 seconds to get the analysis results.
      const hasPending = query.state.data?.some(c => c.status === "pending");
      return hasPending ? 3000 : false;
    },
  });
}

export function useContract(id: number) {
  return useQuery({
    queryKey: [api.contracts.get.path, id],
    queryFn: async () => {      const url = buildUrl(api.contracts.get.path, { id });
      const res = await fetch(getApiUrl(url), { 
        credentials: "include",      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch contract");
      return api.contracts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // If the contract is pending, poll every 3 seconds
      return query.state.data?.status === "pending" ? 3000 : false;
    },
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertContract) => {      const res = await fetch(getApiUrl(api.contracts.create.path), {
        method: api.contracts.create.method,
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create contract");
      }
      return api.contracts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contracts.list.path] });
      toast({ title: "Contract Created", description: "The contract has been successfully added." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAnalyzeContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {      const url = buildUrl(api.contracts.analyze.path, { id });
      const res = await fetch(getApiUrl(url), {
        method: api.contracts.analyze.method,
        credentials: "include",      });
      if (!res.ok) throw new Error("Analysis failed");
      return api.contracts.analyze.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.contracts.get.path, data.id] });
      toast({ title: "Analysis Complete", description: "AI has finished analyzing the contract." });
    },
  });
}

export function useUploadContractFile() {
  return useMutation({
    mutationFn: async (formData: FormData) => {      const res = await fetch(getApiUrl(api.contracts.upload.path), {
        method: api.contracts.upload.method,
        body: formData, // FormData automatically sets correct Content-Type boundary
        credentials: "include",      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }
      return api.contracts.upload.responses[200].parse(await res.json());
    },
    onSuccess: async () => {
      const { toast } = (await import("@/hooks/use-toast")).useToast();
      const queryClient = (await import("@tanstack/react-query")).useQueryClient();
      queryClient.invalidateQueries({ queryKey: [api.contracts.list.path] });
    },
  });
}

