import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { log } from "./server/vite.js";
import { registerRoutes, seedDatabase } from "./server/routes.js";
import { AutonomicEngine } from "./server/services/AutonomicEngine.js";
import { serveStatic } from "./server/static.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging Hook
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resBody: any;

  const originalResJson = res.json;
  res.json = function (body) {
    resBody = body;
    return originalResJson.apply(res, arguments as any);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (resBody) {
        logLine += ` :: ${JSON.stringify(resBody)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

const httpServer = createServer(app);

(async () => {
  try {
    console.log("[BOOTSTRAP] Registering routes...");
    await registerRoutes(httpServer, app);
    console.log("[BOOTSTRAP] Routes registered.");

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Internal Server Error:", err);
      if (res.headersSent) return next(err);
      return res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      console.log("[BOOTSTRAP] Starting Vite...");
      const { setupVite } = await import("./server/vite.js");
      await setupVite(httpServer, app);
      console.log("[BOOTSTRAP] Vite ready.");
    }

    const port = parseInt(process.env.PORT || "3001", 10);
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      console.log("[BOOTSTRAP] Background tasks starting...");
      setTimeout(() => {
        seedDatabase().catch(e => console.error("[BOOTSTRAP] Seed failed:", e.message));
        AutonomicEngine.start();
      }, 1000);
    });
  } catch (err: any) {
    console.error("CRITICAL STARTUP ERROR (catch):", err);
    setTimeout(() => process.exit(1), 2000);
  }
})();
