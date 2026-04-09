import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-config";

export function useAuditLogs() {
  return useQuery({
    queryKey: [api.auditLogs.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("costloci_token");
      const res = await fetch(getApiUrl(api.auditLogs.list.path), { 
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return api.auditLogs.list.responses[200].parse(await res.json());
    },
  });
}
