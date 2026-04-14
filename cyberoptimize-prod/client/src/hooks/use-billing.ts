import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-config";

export function useBillingTelemetry(filters?: { clientId?: string }) {
  return useQuery({
    queryKey: [api.billing.telemetry.path, filters],
    queryFn: async () => {
      const token = localStorage.getItem("costloci_token");
      const url = filters?.clientId 
        ? `${api.billing.telemetry.path}?clientId=${filters.clientId}`
        : api.billing.telemetry.path;
        
      const res = await fetch(getApiUrl(url), { 
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch billing telemetry");
      const result = await res.json();
      return result.data || [];
    },
  });
}
