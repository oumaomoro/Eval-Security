import { Request, Response, NextFunction } from 'express';

/**
 * RBAC Middleware: Role-Based Access Control
 * 
 * Verifies that the authenticated user possesses one of the required roles
 * before allowing access to sensitive enterprise endpoints.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'viewer';
    
    if (!allowedRoles.includes(userRole)) {
       return res.status(403).json({ 
         message: `Access Denied: Your role '${userRole}' does not possess the required permissions (${allowedRoles.join(', ')}).` 
       });
    }
    
    next();
  };
}
