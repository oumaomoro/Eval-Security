import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-config";

export function useVendorScorecards() {
  return useQuery({
    queryKey: [api.vendors.scorecards.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("costloci_token");
      const res = await fetch(getApiUrl(api.vendors.scorecards.list.path), { 
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch scorecards");
      return res.json();
    },
  });
}

export function useVendorBenchmarks() {
  return useQuery({
    queryKey: [api.vendors.benchmarks.path],
    queryFn: async () => {
      const token = localStorage.getItem("costloci_token");
      const res = await fetch(getApiUrl(api.vendors.benchmarks.path), { 
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch benchmarks");
      return res.json();
    },
  });
}
