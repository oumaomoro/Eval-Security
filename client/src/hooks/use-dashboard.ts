import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-config";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {      const res = await fetch(getApiUrl(api.dashboard.stats.path), { 
        credentials: "include",      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Refresh every 5s for high-frequency real-time dashboard telemetry
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
