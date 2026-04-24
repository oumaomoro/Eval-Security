import { Request, Response, NextFunction } from 'express';
import { adminClient as supabase } from "../services/supabase.js";
import { WorkspaceRole } from "../../shared/schema.js";

/**
 * Workspace RBAC Middleware
 * 
 * Verifies that the authenticated user is a member of the workspace
 * and possesses the required role or higher.
 */
export function requireWorkspacePermission(requiredRole: WorkspaceRole) {
  return async (req: any, res: Response, next: NextFunction) => {
    // Attempt to extract workspaceId from various sources
    const workspaceIdStr = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;
    const workspaceId = parseInt(workspaceIdStr);
    
    if (!workspaceId || isNaN(workspaceId)) {
      return res.status(400).json({ error: 'Valid workspaceId is required for this operation' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check membership and role via Supabase
    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      console.error("[WORKSPACE RBAC ERROR]", error);
      return res.status(500).json({ error: 'Interal server error during permission check' });
    }

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this workspace' });
    }

    const roleHierarchy: Record<string, number> = { owner: 4, admin: 3, editor: 2, viewer: 1 };
    const userRoleValue = roleHierarchy[membership.role as string] || 0;
    const requiredRoleValue = roleHierarchy[requiredRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      return res.status(403).json({ 
        error: `Insufficient permissions: Required role is '${requiredRole}', but you are a '${membership.role}'` 
      });
    }

    // Attach workspace context to request
    req.workspace = { id: workspaceId, userRole: membership.role as WorkspaceRole };
    next();
  };
}
