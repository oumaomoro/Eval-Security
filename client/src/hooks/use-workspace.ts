import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export function useWorkspace() {
  const context = useWorkspaceContext();
  
  return {
    workspaces: context.workspaces,
    isLoading: context.isLoading,
    activeWorkspaceId: context.activeWorkspaceId,
    activeWorkspace: context.activeWorkspace,
    switchWorkspace: context.switchWorkspace,
  };
}
