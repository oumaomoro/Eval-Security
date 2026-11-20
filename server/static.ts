import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    // In decoupled architecture (Vercel Backend + Cloudflare Pages Frontend),
    // dist/public is hosted on Cloudflare Pages. The Vercel backend serves API endpoints.
    app.get("/", (_req, res) => {
      res.json({ status: "healthy", service: "costloci-api", mode: "sovereign", timestamp: new Date().toISOString() });
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
