import app, { appReady } from "../server/index.js";

export default async function handler(req: any, res: any) {
  try {
    if (appReady) {
      await appReady;
    }
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Handler Error:", err);
    return res.status(500).json({ error: "Server Initialization Error", message: err.message });
  }
}
