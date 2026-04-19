import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Workspace } from "@shared/schema";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-config";

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: number | null;
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  switchWorkspace: (id: number) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(() => {
    const saved = localStorage.getItem("costloci_active_workspace_id");
    return saved ? parseInt(saved) : null;
  });

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.workspaces.list.path), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data = await res.json();
      return api.workspaces.list.responses[200].parse(data);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

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
    queryClient.invalidateQueries(); // Invalidate all on workspace switch for safety
  };

  const activeWorkspace = workspaces?.find(w => w.id === activeWorkspaceId) || workspaces?.[0] || null;

  const value = {
    workspaces: workspaces || [],
    activeWorkspaceId,
    activeWorkspace,
    isLoading,
    switchWorkspace,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceProvider");
  }
  return context;
}
