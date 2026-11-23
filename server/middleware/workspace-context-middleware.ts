import { Request, Response, NextFunction } from "express";
import { storageContext } from "../services/storageContext.js";
import { adminClient } from "../services/supabase.js";

export function workspaceContextMiddleware(req: any, res: Response, next: NextFunction) {
 // Extract workspace ID from header (preferred for API) or query/body
 // Also check req.user.workspaceId (populated by auth bypass or normal auth)
 const workspaceIdHeader = req.headers["x-workspace-id"];
 const workspaceId = (workspaceIdHeader ? parseInt(workspaceIdHeader as string) : undefined) 
 || req.user?.workspaceId 
 || req.query.workspaceId 
 || req.body?.workspaceId;

 // Run the rest of the request within the context
 // Only overwrite context if we actually found a workspaceId
 if (workspaceId) {
 storageContext.run({ client: adminClient, workspaceId }, () => {
 next();
 });
 } else {
 next();
 }
}
