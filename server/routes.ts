import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import multer from "multer";

// We'll use the OpenAI client from the replit integration
// Importing from 'openai' directly as configured in the batch/chat modules
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
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Register Chat Routes (optional, but requested in guide)
  registerChatRoutes(app);

  // === ROUTES ===

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
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
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

    // Mock AI Analysis (since we don't have the file content parsed yet)
    // In a real app, we'd read the fileUrl, extract text, and send to OpenAI.
    // For now, we'll simulate a structured response.
    
    try {
      const analysisPrompt = `Analyze a cybersecurity contract for ${contract.vendorName} providing ${contract.productService}. 
      Generate realistic JSON data for:
      - extractedDates (start, renewal)
      - slaMetrics (uptime, response time)
      - dataPrivacy (GDPR/KDPA compliance)
      - riskFlags (array of strings)
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || "{}");
      
      const updated = await storage.updateContract(contract.id, {
        aiAnalysis
      });
      
      // Also auto-generate risks based on analysis
      if (aiAnalysis.riskFlags) {
        for (const flag of aiAnalysis.riskFlags) {
          await storage.createRisk({
            contractId: contract.id,
            riskTitle: "AI Identified Risk",
            riskCategory: "compliance",
            riskDescription: flag,
            severity: "medium",
            likelihood: "medium",
            impact: "medium",
            mitigationStatus: "identified",
            aiConfidence: 85
          });
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      res.status(500).json({ message: "AI Analysis failed" });
    }
  });
  
  // File Upload (Mock)
  app.post(api.contracts.upload.path, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    // In a real app, upload to Object Storage or S3
    const mockUrl = `https://example.com/uploads/${req.file.originalname}`;
    
    res.json({
      url: mockUrl,
      filename: req.file.originalname
    });
  });

  // Compliance
  app.get(api.compliance.list.path, async (req, res) => {
    const audits = await storage.getComplianceAudits();
    res.json(audits);
  });
  
  app.post(api.compliance.run.path, async (req, res) => {
    try {
      const { scope } = req.body;
      
      // Create initial audit record
      const audit = await storage.createComplianceAudit({
        auditName: `Automated Audit - ${new Date().toLocaleDateString()}`,
        auditType: "automated",
        scope,
        status: "in_progress",
        complianceByStandard: {},
        findings: []
      });
      
      // Simulate AI Processing asynchronously
      (async () => {
        try {
          const prompt = `Conduct a mock compliance audit against ${scope.standards.join(", ")}. 
          Return JSON with overallComplianceScore (0-100), complianceByStandard (map), 
          and findings (array of {severity, description, recommendation}).`;
          
          const response = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          
          const result = JSON.parse(response.choices[0].message.content || "{}");
          
          await storage.updateComplianceAudit(audit.id, {
            status: "completed",
            overallComplianceScore: result.overallComplianceScore || 85,
            complianceByStandard: result.complianceByStandard || {},
            findings: result.findings || [],
          });
        } catch (e) {
          await storage.updateComplianceAudit(audit.id, { status: "failed" });
        }
      })();
      
      res.status(201).json(audit);
    } catch (error) {
      res.status(500).json({ message: "Audit failed to start" });
    }
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.risks.mitigate.path, async (req, res) => {
    const { status, strategy } = req.body;
    const risk = await storage.updateRisk(Number(req.params.id), {
      mitigationStatus: status,
      // Logic to append strategy would go here
    });
    res.json(risk);
  });

  // Clauses
  app.get(api.clauses.list.path, async (req, res) => {
    const clauses = await storage.getClauseLibrary();
    res.json(clauses);
  });

  app.post(api.clauses.generate.path, async (req, res) => {
    try {
      const { category, requirements } = req.body;
      const prompt = `Draft a legal clause for category: "${category}". Requirements: ${requirements}. 
      Return JSON with clauseText and explanation.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Clause generation failed" });
    }
  });

  // Dashboard
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const clients = await storage.getClients();
  if (clients.length === 0) {
    const client = await storage.createClient({
      companyName: "Acme Corp",
      industry: "Finance",
      contactName: "John Doe",
      contactEmail: "john@acme.com",
      status: "active"
    });

    await storage.createContract({
      clientId: client.id,
      vendorName: "CrowdStrike",
      productService: "Falcon Endpoint",
      category: "endpoint_protection",
      annualCost: 120000,
      contractStartDate: "2024-01-01",
      renewalDate: "2025-01-01",
      status: "active",
      aiAnalysis: {
        riskFlags: ["Missing DPA", "Liability cap too low"],
        summary: "Standard contract with some compliance gaps."
      }
    });
    
    await storage.createClause({
      clauseName: "Standard Data Protection",
      clauseCategory: "data_protection",
      standardLanguage: "The Processor shall...",
      riskLevelIfMissing: "high"
    });
  }
}
