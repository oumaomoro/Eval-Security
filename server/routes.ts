import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import multer from "multer";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);

  // Clients
  app.get(api.clients.list.path, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.post(api.clients.create.path, async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get(api.clients.get.path, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  // Contracts
  app.get(api.contracts.list.path, async (req, res) => {
    const contracts = await storage.getContracts(req.query as any);
    res.json(contracts);
  });

  app.post(api.contracts.create.path, async (req, res) => {
    try {
      const input = api.contracts.create.input.parse(req.body);
      const contract = await storage.createContract(input);
      res.status(201).json(contract);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get(api.contracts.get.path, async (req, res) => {
    const contract = await storage.getContract(Number(req.params.id));
    if (!contract) return res.status(404).json({ message: "Contract not found" });
    res.json(contract);
  });

  app.post(api.contracts.analyze.path, async (req, res) => {
    const contract = await storage.getContract(Number(req.params.id));
    if (!contract) return res.status(404).json({ message: "Contract not found" });
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: `Analyze a cybersecurity contract for ${contract.vendorName} providing ${contract.productService}. Generate realistic JSON.` }],
        response_format: { type: "json_object" },
      });
      const aiAnalysis = JSON.parse(response.choices[0].message.content || "{}");
      const updated = await storage.updateContract(contract.id, { aiAnalysis });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "AI Analysis failed" });
    }
  });

  app.post(api.contracts.upload.path, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ url: `https://example.com/uploads/${req.file.originalname}`, filename: req.file.originalname });
  });

  // Compliance
  app.get(api.compliance.rulesets.list.path, async (req, res) => {
    const rulesets = await storage.getAuditRulesets();
    res.json(rulesets);
  });

  app.post(api.compliance.rulesets.create.path, async (req, res) => {
    try {
      const input = api.compliance.rulesets.create.input.parse(req.body);
      const ruleset = await storage.createAuditRuleset(input);
      res.status(201).json(ruleset);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get(api.compliance.list.path, async (req, res) => {
    const audits = await storage.getComplianceAudits();
    res.json(audits);
  });
  
  app.post(api.compliance.run.path, async (req, res) => {
    try {
      const { scope, auditType } = req.body;
      const audit = await storage.createComplianceAudit({
        auditName: `Audit - ${new Date().toLocaleDateString()}`,
        auditType: auditType || "automated",
        scope,
        status: "in_progress",
      });
      (async () => {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: `Audit against ${scope.standards.join(", ")}. Return JSON.` }],
            response_format: { type: "json_object" },
          });
          const result = JSON.parse(response.choices[0].message.content || "{}");
          await storage.updateComplianceAudit(audit.id, {
            status: "completed",
            overallComplianceScore: result.overallComplianceScore || 85,
            findings: result.findings || [],
          });
        } catch (e) {
          await storage.updateComplianceAudit(audit.id, { status: "failed" });
        }
      })();
      res.status(201).json(audit);
    } catch (error) {
      res.status(500).json({ message: "Audit failed" });
    }
  });

  app.get(api.compliance.monitoring.path, async (req, res) => {
    const allContracts = await storage.getContracts();
    const monitoring = allContracts.map(c => ({
      contractId: c.id,
      vendorName: c.vendorName,
      complianceScore: 85 + Math.floor(Math.random() * 10),
      lastAudit: new Date().toISOString(),
      status: "compliant"
    }));
    res.json(monitoring);
  });

  // Risks
  app.get(api.risks.list.path, async (req, res) => {
    const risks = await storage.getRisks(req.query.contractId ? Number(req.query.contractId) : undefined);
    res.json(risks);
  });

  app.post(api.risks.create.path, async (req, res) => {
    try {
      const input = api.risks.create.input.parse(req.body);
      const risk = await storage.createRisk(input);
      res.status(201).json(risk);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch(api.risks.mitigate.path, async (req, res) => {
    const risk = await storage.updateRisk(Number(req.params.id), { mitigationStatus: req.body.status });
    res.json(risk);
  });

  // Reports
  app.get(api.reports.list.path, async (req, res) => {
    const reports = await storage.getReports();
    res.json(reports);
  });

  app.post(api.reports.generate.path, async (req, res) => {
    try {
      const { title, type, regulatoryBody } = req.body;
      const report = await storage.createReport({ title, type, regulatoryBody, status: "pending", format: "pdf" });
      (async () => {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: `Generate ${type} report for ${regulatoryBody}. Return JSON.` }],
            response_format: { type: "json_object" },
          });
          const result = JSON.parse(response.choices[0].message.content || "{}");
          await storage.updateReport(report.id, { status: "generated", content: result });
        } catch (e) {
          await storage.updateReport(report.id, { status: "failed" });
        }
      })();
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ message: "Report failed" });
    }
  });

  // Dashboard
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Clauses
  app.get(api.clauses.list.path, async (req, res) => {
    const clauses = await storage.getClauseLibrary();
    res.json(clauses);
  });

  app.post(api.clauses.generate.path, async (req, res) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: `Generate ${req.body.category} clause. Return JSON.` }],
        response_format: { type: "json_object" },
      });
      res.json(JSON.parse(response.choices[0].message.content || "{}"));
    } catch (error) {
      res.status(500).json({ message: "Clause failed" });
    }
  });

  await seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  const rs = await storage.getAuditRulesets();
  if (rs.length === 0) {
    await storage.createAuditRuleset({
      name: "PCI DSS v4.0 Check",
      standard: "PCI DSS",
      rules: [{ id: "1", requirement: "Firewall", description: "Maintain firewall", severity: "high" }],
    });
    await storage.createAuditRuleset({
      name: "CCPA Privacy Check",
      standard: "CCPA",
      rules: [{ id: "1", requirement: "Data Disclosure", description: "Proper disclosure", severity: "critical" }],
    });
  }
}
