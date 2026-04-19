import { storage } from '../server/storage';
import { randomUUID } from 'crypto';

async function testProvisioning() {
  const userId = randomUUID();
  console.log(`🚀 Testing provisioning for user: ${userId}`);
  
  try {
    console.log("1. Creating Workspace...");
    const workspace = await storage.createWorkspace({
      name: "Test Diagnostic Workspace",
      ownerId: userId,
      plan: "starter"
    });
    console.log("✅ Workspace created:", workspace.id);

    console.log("2. Creating Membership...");
    const membership = await storage.addWorkspaceMember({
      userId,
      workspaceId: workspace.id,
      role: "owner"
    });
    console.log("✅ Membership created:", membership.id);

    console.log("3. Verifying getUserWorkspaces...");
    const userWorkspaces = await storage.getUserWorkspaces(userId);
    console.log("✅ User Workspaces found:", userWorkspaces.length);

  } catch (err: any) {
    console.error("💥 PROVISIONING TEST FAILED:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

testProvisioning();
