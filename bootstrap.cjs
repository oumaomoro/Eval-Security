const { register } = require('tsx/register');

// Register tsx to handle .ts files
register();

console.log("[BOOTSTRAP] CJS Loader active. Booting Cyber-Optimize...");

// Import the main server logic
// We use a dynamic import here because index.ts is ESM (type: module)
import('./index.ts').catch(err => {
  console.error("[BOOTSTRAP] Fatal error during ESM lift-off:", err);
  process.exit(1);
});
