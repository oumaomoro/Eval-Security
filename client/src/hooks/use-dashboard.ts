import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-config";

import { useWorkspace } from "@/hooks/use-workspace";

export function useDashboardStats() {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: [api.dashboard.stats.path, activeWorkspaceId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.dashboard.stats.path), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
    refetchInterval: 60000, // 1 minute refresh
    staleTime: 300000, // 5 minutes caching
  });
}

export function useVendorBenchmarks() {
  return useQuery({
    queryKey: [api.vendors.benchmarks.path],
    queryFn: async () => {      const res = await fetch(getApiUrl(api.vendors.benchmarks.path), { 
        credentials: "include",      });
      if (!res.ok) throw new Error("Failed to fetch vendor benchmarks");
      return res.json();
    },
    refetchInterval: 10000, 
  });
}
