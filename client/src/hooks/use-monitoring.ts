import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import { type ContinuousMonitoring, type InsertContinuousMonitoring } from "@shared/schema";

export function useMonitoringConfigs() {
  return useQuery<ContinuousMonitoring[]>({
    queryKey: ["/api/compliance/monitoring"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/compliance/monitoring"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch monitoring configurations");
      return res.json();
    }
  });
}

export function useCreateMonitoringConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: InsertContinuousMonitoring) => {
      const res = await fetch(getApiUrl("/api/compliance/monitoring"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create monitoring configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/monitoring"] });
      toast({
        title: "Monitoring Pipeline Active",
        description: "Continuous compliance tracking has been initiated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Configuration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMonitoringConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ContinuousMonitoring> }) => {
      const res = await fetch(getApiUrl(`/api/compliance/monitoring/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update monitoring configuration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/monitoring"] });
      toast({
        title: "Pipeline Updated",
        description: "Monitoring configuration has been synchronized.",
      });
    },
  });
}

export function useDeleteMonitoringConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(getApiUrl(`/api/compliance/monitoring/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete monitoring configuration");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/monitoring"] });
      toast({
        title: "Pipeline Terminated",
        description: "The monitoring pipeline has been permanently removed.",
        variant: "destructive"
      });
    },
  });
}
