import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { type Workspace } from "@shared/schema";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-config";

export function useWorkspace() {
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(() => {
    const saved = localStorage.getItem("costloci_active_workspace_id");
    return saved ? parseInt(saved) : null;
  });

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {      const res = await fetch(getApiUrl(api.workspaces.list.path), { 
        credentials: "include",      });
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return api.workspaces.list.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Ensure an active workspace is set if we have workspaces but none selected
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && activeWorkspaceId === null) {
      const firstId = workspaces[0].id;
      setActiveWorkspaceId(firstId);
      localStorage.setItem("costloci_active_workspace_id", firstId.toString());
    }
  }, [workspaces, activeWorkspaceId]);

  const switchWorkspace = (id: number) => {
    setActiveWorkspaceId(id);
    localStorage.setItem("costloci_active_workspace_id", id.toString());
    // Refetch dashboard and other workspace-scoped queries
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
  };

  const activeWorkspace = workspaces?.find(w => w.id === activeWorkspaceId) || workspaces?.[0] || null;

  return {
    workspaces: workspaces || [],
    isLoading,
    activeWorkspaceId: activeWorkspace?.id || null,
    activeWorkspace,
    switchWorkspace,
  };
}
