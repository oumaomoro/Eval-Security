import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Client } from "@shared/schema";
import { getApiUrl } from "@/lib/api-config";

import { useWorkspace } from "@/hooks/use-workspace";

export function useClients() {
  const { activeWorkspaceId } = useWorkspace();

  return useQuery<Client[]>({
    queryKey: [api.clients.list.path, activeWorkspaceId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.clients.list.path), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = await res.json();
      return api.clients.list.responses[200].parse(data);
    },
  });
}
