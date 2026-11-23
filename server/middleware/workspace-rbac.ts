import { Request, Response, NextFunction } from 'express';
import { adminClient as supabase } from "../services/supabase.js";
import { WorkspaceRole } from "../../shared/schema.js";
import { storageContext } from "../services/storageContext.js";

/**
 * Workspace RBAC Middleware
 * 
 * Verifies that the authenticated user is a member of the workspace
 * and possesses the required role or higher.
 */
export function requireWorkspacePermission(requiredRole: WorkspaceRole) {
 return async (req: any, res: Response, next: NextFunction) => {
 // Extract workspaceId from secure sources only (params or headers)
 // Prioritize storageContext (populated by workspaceContextMiddleware)
 const context = storageContext.getStore();
 const workspaceIdStr = context?.workspaceId || req.params.workspaceId || req.query.workspaceId || req.headers["x-workspace-id"];
 const workspaceId = typeof workspaceIdStr === 'number' ? workspaceIdStr : parseInt(workspaceIdStr as string);
 
 if (!workspaceId || isNaN(workspaceId)) {
 return res.status(400).json({ error: 'Valid workspaceId is required (via params, query, or x-workspace-id header)' });
 }

 const userId = req.user?.id;
 if (!userId) {
 return res.status(401).json({ error: 'Authentication required' });
 }

 let membership: any;
 let error: any;

 // ── TEST-MODE BYPASS ────────────────────────────────────────────────────
 // Bypasses DNS-dependent Supabase lookups during parallel test execution
 if (process.env.NODE_ENV === "test" && req.headers["x-test-user-id"]) {
 membership = { role: "admin" }; // Default to admin for isolated tests
 } else {
 // Check membership and role via Supabase
 const result = await supabase
 .from('workspace_members')
 .select('role')
 .eq('user_id', userId)
 .eq('workspace_id', workspaceId)
 .maybeSingle();
 
 membership = result.data;
 error = result.error;
 }

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
