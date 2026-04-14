
import { storage } from "./server/storage";
import { setupAuth } from "./server/replit_integrations/auth";
import { AutonomicEngine } from "./server/services/AutonomicEngine";

console.log("Imports successful");
try {
  AutonomicEngine.start();
  console.log("AutonomicEngine started");
} catch (e) {
  console.error("AutonomicEngine start failed", e);
}
console.log("Test finished");
process.exit(0);
