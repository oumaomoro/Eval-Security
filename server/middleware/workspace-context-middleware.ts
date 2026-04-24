import { Request, Response, NextFunction } from "express";
import { storageContext } from "../services/storageContext.js";
import { adminClient } from "../services/supabase.js";

export function workspaceContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract workspace ID from header (preferred for API) or query/body
  const workspaceIdHeader = req.headers["x-workspace-id"];
  const workspaceId = workspaceIdHeader ? parseInt(workspaceIdHeader as string) : undefined;

  // Run the rest of the request within the context
  storageContext.run({ client: adminClient, workspaceId }, () => {
    next();
  });
}
