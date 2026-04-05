import { db } from "./db";
import {
  clients, contracts, auditRulesets, complianceAudits, risks, clauseLibrary, savingsOpportunities, reports, vendorScorecards, workspaces, comments, users, contractComparisons,
  infrastructureLogs, billingTelemetry, auditLogs,
  remediationSuggestions, playbooks, userPlaybooks, regulatoryAlerts,
  type InsertClient, type InsertContract, type InsertAuditRuleset, type InsertComplianceAudit,
  type InsertRisk, type InsertClause, type InsertSavings, type InsertReport, type InsertVendorScorecard, type InsertWorkspace, type InsertComment, type InsertContractComparison,
  type InsertInfrastructureLog, type InsertBillingTelemetry, type InsertAuditLog,
  type InsertRemediationSuggestion, type InsertPlaybook, type InsertUserPlaybook, type InsertRegulatoryAlert,
  type Client, type Contract, type AuditRuleset, type ComplianceAudit, type Risk, type Clause, type SavingsOpportunity, type Report, type VendorScorecard, type Workspace, type Comment, type ContractComparison,
  type InfrastructureLog, type BillingTelemetry, type AuditLog,
  type RemediationSuggestion, type Playbook, type UserPlaybook, type RegulatoryAlert,
  type User
} from "@shared/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;

  // Contracts
  getContracts(filters?: { clientId?: number, status?: string }): Promise<(Contract & { client?: Client })[]>;
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, updates: Partial<InsertContract> & { aiAnalysis?: any }): Promise<Contract>;

  // Compliance
  getAuditRulesets(): Promise<AuditRuleset[]>;
  getAuditRuleset(id: number): Promise<AuditRuleset | undefined>;
  createAuditRuleset(ruleset: InsertAuditRuleset): Promise<AuditRuleset>;
  updateAuditRuleset(id: number, updates: Partial<AuditRuleset>): Promise<AuditRuleset>;
  deleteAuditRuleset(id: number): Promise<void>;
  getComplianceAudits(): Promise<ComplianceAudit[]>;
  createComplianceAudit(audit: InsertComplianceAudit): Promise<ComplianceAudit>;
  updateComplianceAudit(id: number, updates: Partial<ComplianceAudit>): Promise<ComplianceAudit>;

  // Risks
  getRisks(contractId?: number): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: number, updates: Partial<Risk>): Promise<Risk>;

  // Clauses
  getClauseLibrary(): Promise<Clause[]>;
  createClause(clause: InsertClause): Promise<Clause>;

  // Savings
  getSavingsOpportunities(contractId?: number): Promise<SavingsOpportunity[]>;
  createSavingsOpportunity(savings: InsertSavings): Promise<SavingsOpportunity>;

  // Reports
  getReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, updates: Partial<Report>): Promise<Report>;

  // Scorecards
  getVendorScorecards(vendorName?: string): Promise<VendorScorecard[]>;
  createVendorScorecard(scorecard: InsertVendorScorecard): Promise<VendorScorecard>;

  // Dashboard
  getDashboardStats(clientId?: number): Promise<any>;
  getRiskHeatmap(clientId?: number): Promise<any[]>;

  // Intelligence & Benchmarking
  getMarketIntelligence(contractId: number): Promise<any>;

  // Comments
  getComments(contractId?: number, auditId?: number): Promise<(Comment & { user: any })[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Workspaces
  getWorkspaces(): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;

  // Comparisons
  getContractComparisons(contractId: number): Promise<ContractComparison[]>;
  createContractComparison(comparison: InsertContractComparison): Promise<ContractComparison>;

  // Infrastructure & Self-Healing
  getInfrastructureLogs(): Promise<InfrastructureLog[]>;
  createInfrastructureLog(log: InsertInfrastructureLog): Promise<InfrastructureLog>;
  updateInfrastructureLog(id: number, updates: Partial<InfrastructureLog>): Promise<InfrastructureLog>;

  // Billing & Telemetry
  getBillingTelemetry(clientId?: number): Promise<BillingTelemetry[]>;
  createBillingTelemetry(telemetry: InsertBillingTelemetry): Promise<BillingTelemetry>;

  // Audit Logs
  getAuditLogs(clientId?: number, userId?: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUsersByClientId(clientId: number): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  createUser(user: Partial<User>): Promise<User>;

  // Regulatory Alerts
  getRegulatoryAlerts(status?: string): Promise<RegulatoryAlert[]>;
  createRegulatoryAlert(alert: InsertRegulatoryAlert): Promise<RegulatoryAlert>;
}

export class DatabaseStorage implements IStorage {
  // Clients
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsersByClientId(clientId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.clientId, clientId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [result] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const [result] = await db.insert(users).values(user as any).returning();
    return result;
  }

  // Contracts
  async getContracts(filters?: { clientId?: number, status?: string }): Promise<(Contract & { client?: Client })[]> {
    let query = db.select().from(contracts).leftJoin(clients, eq(contracts.clientId, clients.id));
    const results = await query;
    let mapped = results.map(r => ({ ...r.contracts, client: r.clients || undefined }));

    if (filters?.clientId) {
      mapped = mapped.filter(c => c.clientId === filters.clientId);
    }
    if (filters?.status) {
      mapped = mapped.filter(c => c.status === filters.status);
    }

    return mapped;
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async updateContract(id: number, updates: Partial<InsertContract> & { aiAnalysis?: any }): Promise<Contract> {
    const [updated] = await db.update(contracts).set(updates).where(eq(contracts.id, id)).returning();
    return updated;
  }

  // Compliance
  async getAuditRulesets(): Promise<AuditRuleset[]> {
    return db.select().from(auditRulesets).orderBy(desc(auditRulesets.createdAt));
  }

  async getAuditRuleset(id: number): Promise<AuditRuleset | undefined> {
    const [ruleset] = await db.select().from(auditRulesets).where(eq(auditRulesets.id, id));
    return ruleset;
  }

  async createAuditRuleset(ruleset: InsertAuditRuleset): Promise<AuditRuleset> {
    const [newRuleset] = await db.insert(auditRulesets).values(ruleset).returning();
    return newRuleset;
  }

  async updateAuditRuleset(id: number, updates: Partial<AuditRuleset>): Promise<AuditRuleset> {
    const [result] = await db.update(auditRulesets).set(updates).where(eq(auditRulesets.id, id)).returning();
    if (!result) throw new Error("Ruleset not found");
    return result;
  }

  async deleteAuditRuleset(id: number): Promise<void> {
    await db.delete(auditRulesets).where(eq(auditRulesets.id, id));
  }

  async getComplianceAudits(): Promise<ComplianceAudit[]> {
    return db.select().from(complianceAudits).orderBy(desc(complianceAudits.createdAt));
  }

  async createComplianceAudit(audit: InsertComplianceAudit): Promise<ComplianceAudit> {
    const [newAudit] = await db.insert(complianceAudits).values(audit).returning();
    return newAudit;
  }

  async updateComplianceAudit(id: number, updates: Partial<ComplianceAudit>): Promise<ComplianceAudit> {
    const [updated] = await db.update(complianceAudits).set(updates).where(eq(complianceAudits.id, id)).returning();
    return updated;
  }

  // Risks
  async getRisks(contractId?: number): Promise<Risk[]> {
    if (contractId) {
      return db.select().from(risks).where(eq(risks.contractId, contractId));
    }
    return db.select().from(risks).orderBy(desc(risks.riskScore));
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const [newRisk] = await db.insert(risks).values(risk).returning();
    return newRisk;
  }

  async updateRisk(id: number, updates: Partial<Risk>): Promise<Risk> {
    const [updated] = await db.update(risks).set(updates).where(eq(risks.id, id)).returning();
    return updated;
  }

  // Clauses
  async getClauseLibrary(): Promise<Clause[]> {
    return db.select().from(clauseLibrary);
  }

  async createClause(clause: InsertClause): Promise<Clause> {
    const [newClause] = await db.insert(clauseLibrary).values(clause).returning();
    return newClause;
  }

  // Savings
  async getSavingsOpportunities(contractId?: number): Promise<SavingsOpportunity[]> {
    if (contractId) {
      return db.select().from(savingsOpportunities).where(eq(savingsOpportunities.contractId, contractId));
    }
    return db.select().from(savingsOpportunities).orderBy(desc(savingsOpportunities.estimatedSavings));
  }

  async createSavingsOpportunity(savings: InsertSavings): Promise<SavingsOpportunity> {
    const [newSavings] = await db.insert(savingsOpportunities).values(savings).returning();
    return newSavings;
  }

  // Reports
  async getReports(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async updateReport(id: number, updates: Partial<Report>): Promise<Report> {
    const [updated] = await db.update(reports).set(updates).where(eq(reports.id, id)).returning();
    return updated;
  }

  // Scorecards
  async getVendorScorecards(vendorName?: string): Promise<VendorScorecard[]> {
    if (vendorName) {
      return db.select().from(vendorScorecards).where(eq(vendorScorecards.vendorName, vendorName));
    }
    return db.select().from(vendorScorecards).orderBy(desc(vendorScorecards.lastAssessmentDate));
  }

  async createVendorScorecard(scorecard: InsertVendorScorecard): Promise<VendorScorecard> {
    const [newScorecard] = await db.insert(vendorScorecards).values(scorecard).returning();
    return newScorecard;
  }

  // Dashboard
  async getDashboardStats(clientId?: number): Promise<any> {
    const whereClause = clientId ? eq(contracts.clientId, clientId) : undefined;
    
    const [contractStats] = await db.select({
      count: sql<number>`count(*)`,
      totalCost: sql<number>`sum(${contracts.annualCost})`
    }).from(contracts).where(whereClause);

    const [riskStats] = await db.select({
      criticalCount: sql<number>`count(*)`
    }).from(risks)
      .innerJoin(contracts, eq(risks.contractId, contracts.id))
      .where(clientId ? sql`${contracts.clientId} = ${clientId} AND ${risks.severity} = 'critical'` : eq(risks.severity, 'critical'));

    const upcomingRenewals = await db.select().from(contracts)
      .where(whereClause)
      .limit(5)
      .orderBy(contracts.renewalDate);

    const costByVendor = await db.select({
      vendor: contracts.vendorName,
      cost: sql<number>`sum(${contracts.annualCost})`
    })
      .from(contracts)
      .where(whereClause)
      .groupBy(contracts.vendorName)
      .orderBy(sql`sum(${contracts.annualCost}) desc`)
      .limit(5);

    const [savingsStats] = await db.select({
      totalSavings: sql<number>`sum(${savingsOpportunities.estimatedSavings})`,
      count: sql<number>`count(*)`
    }).from(savingsOpportunities)
      .innerJoin(contracts, eq(savingsOpportunities.contractId, contracts.id))
      .where(clientId ? sql`${contracts.clientId} = ${clientId} AND ${savingsOpportunities.status} = 'identified'` : eq(savingsOpportunities.status, 'identified'));

    const totalPotentialSavings = Number(savingsStats?.totalSavings || 0);
    const avgComplianceScore = 100 - (Number(riskStats?.criticalCount || 0) * 5); 

    // Live MRR calculation from Costloci subscription tiers
    const allUsers = await db.select().from(users);
    const liveMrr = allUsers.reduce((sum, u) => {
       if (u.subscriptionTier === 'enterprise') return sum + 999;
       if (u.subscriptionTier === 'pro') return sum + 299;
       if (u.subscriptionTier === 'starter') return sum + 99;
       return sum;
    }, 0);

    const [mitigatedStats] = await db.select({
      count: sql<number>`count(*)`
    }).from(risks)
      .innerJoin(contracts, eq(risks.contractId, contracts.id))
      .where(clientId ? sql`${contracts.clientId} = ${clientId} AND ${risks.mitigationStatus} = 'mitigated'` : eq(risks.mitigationStatus, 'mitigated'));

    const totalContracts = Number(contractStats.count || 0);
    const risksMitigated = Number(mitigatedStats?.count || 0);
    const timeSaved = (totalContracts * 4.5) + (risksMitigated * 2.0); // 4.5h per audit + 2h per mitigation

    return {
      totalContracts,
      totalAnnualCost: Number(contractStats.totalCost || 0),
      totalPotentialSavings,
      avgComplianceScore: Math.max(avgComplianceScore, 0),
      criticalRisks: Number(riskStats.criticalCount || 0),
      upcomingRenewals,
      costByVendor: costByVendor.map(c => ({ vendor: c.vendor, cost: Number(c.cost) })),
      complianceTrends: [
        { month: "Jan", score: 82 },
        { month: "Feb", score: 85 },
        { month: "Mar", score: 89 }
      ],
      technicalMetrics: {
        apiResponseTimeAvgMs: 145,
        aiAccuracyRate: 99.2,
        systemUptime: 99.99,
        errorRate: 0.02,
        userEngagement: 88,
      },
      businessMetrics: {
        mrr: clientId ? 0 : liveMrr,
        cac: clientId ? 0 : 3500, 
        ltv: clientId ? 0 : liveMrr * 36, 
        churnRate: 0,
        nps: 92,
      },
      userMetrics: {
        contractsAnalyzedPerMonth: totalContracts,
        complianceScoreImprovement: 12.5,
        savingsOpportunitiesIdentified: Number(savingsStats.count || 0),
        risksMitigated,
        timeSavedHours: timeSaved,
      },
      remediationLog: []
    };
  }

  async getRiskHeatmap(clientId?: number): Promise<any[]> {
    const allRisks = await db.select().from(risks);
    const categories = Array.from(new Set(allRisks.map(r => r.riskCategory)));
    
    return categories.map(cat => {
      const catRisks = allRisks.filter(r => r.riskCategory === cat);
      const avgCompliance = 100 - (catRisks.reduce((sum, r) => sum + (Number(r.riskScore) || 0), 0) / catRisks.length);
      const maxImpact = catRisks.reduce((max, r) => {
          const impactValue = r.impact === 'very_high' ? 100 : r.impact === 'high' ? 75 : r.impact === 'medium' ? 50 : 25;
          return Math.max(max, impactValue);
      }, 0);

      return {
        name: cat,
        compliance: Math.round(avgCompliance),
        risk: Math.round(catRisks.reduce((sum, r) => sum + (Number(r.riskScore) || 0), 0) / catRisks.length),
        impact: maxImpact
      };
    });
  }

  async getMarketIntelligence(contractId: number): Promise<any> {
    const contract = await this.getContract(contractId);
    if (!contract) throw new Error("Contract not found");

    const categoryAverages = await db.select({
      avgCost: sql<number>`avg(${contracts.annualCost})`,
      avgTerm: sql<number>`avg(${contracts.contractTermMonths})`,
      count: sql<number>`count(*)`
    }).from(contracts).where(eq(contracts.category, contract.category));

    const [stats] = categoryAverages;

    return {
      category: contract.category,
      peerCount: Number(stats.count),
      marketAverages: {
        annualCost: Number(stats.avgCost || 0),
        termMonths: Number(stats.avgTerm || 0)
      },
      comparison: {
        costPercentile: contract.annualCost && stats.avgCost 
          ? (contract.annualCost < stats.avgCost ? "below_market" : "above_market") 
          : "unclear",
        savingsPotential: contract.annualCost && stats.avgCost && contract.annualCost > stats.avgCost
          ? contract.annualCost - stats.avgCost
          : 0
      }
    };
  }

  // Comments
  async getComments(contractId?: number, auditId?: number): Promise<(Comment & { user: any })[]> {
    let query = db.select().from(comments);
    if (contractId) query = db.select().from(comments).where(eq(comments.contractId, contractId)) as any;
    else if (auditId) query = db.select().from(comments).where(eq(comments.auditId, auditId)) as any;

    const results = await (query as any).orderBy(desc(comments.createdAt));
    const userIds: string[] = Array.from(new Set(results.map((c: any) => c.userId as string)));
    const allUsers = userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];

    return results.map((c: any) => ({
      ...c,
      user: allUsers.find(u => u.id === c.userId)
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return db.select().from(workspaces).orderBy(desc(workspaces.createdAt));
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [newWorkspace] = await db.insert(workspaces).values(workspace).returning();
    return newWorkspace;
  }

  // Comparisons
  async getContractComparisons(contractId: number): Promise<ContractComparison[]> {
    return db.select().from(contractComparisons).where(eq(contractComparisons.contractId, contractId)).orderBy(desc(contractComparisons.createdAt));
  }

  async createContractComparison(comparison: InsertContractComparison): Promise<ContractComparison> {
    const [newComp] = await db.insert(contractComparisons).values(comparison).returning();
    return newComp;
  }

  // Infrastructure & Self-Healing
  async getInfrastructureLogs(): Promise<InfrastructureLog[]> {
    return db.select().from(infrastructureLogs).orderBy(desc(infrastructureLogs.timestamp)).limit(50);
  }

  async createInfrastructureLog(log: InsertInfrastructureLog): Promise<InfrastructureLog> {
    const [result] = await db.insert(infrastructureLogs).values(log).returning();
    return result;
  }

  async updateInfrastructureLog(id: number, updates: Partial<InfrastructureLog>): Promise<InfrastructureLog> {
    const [result] = await db.update(infrastructureLogs).set(updates).where(eq(infrastructureLogs.id, id)).returning();
    return result;
  }

  // Billing & Telemetry
  async getBillingTelemetry(clientId?: number): Promise<BillingTelemetry[]> {
    if (clientId) return db.select().from(billingTelemetry).where(eq(billingTelemetry.clientId, clientId)).orderBy(desc(billingTelemetry.timestamp));
    return db.select().from(billingTelemetry).orderBy(desc(billingTelemetry.timestamp)).limit(200);
  }

  async createBillingTelemetry(telemetry: InsertBillingTelemetry): Promise<BillingTelemetry> {
    const [result] = await db.insert(billingTelemetry).values(telemetry).returning();
    return result;
  }

  // Audit Logs
  async getAuditLogs(clientId?: number, userId?: string): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    if (clientId) query = query.where(eq(auditLogs.clientId, clientId)) as any;
    if (userId) query = query.where(eq(auditLogs.userId, userId)) as any;
    return query.orderBy(desc(auditLogs.timestamp)).limit(500);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  // --- REDLINING & REMEDIATION ---
  async getClauses(): Promise<Clause[]> {
    return await db.select().from(clauseLibrary);
  }

  async createRemediationSuggestion(suggestion: InsertRemediationSuggestion): Promise<RemediationSuggestion> {
    const [newSuggestion] = await db.insert(remediationSuggestions).values(suggestion).returning();
    return newSuggestion;
  }

  // --- REGULATORY ALERTS ---
  async getRegulatoryAlerts(status?: string): Promise<RegulatoryAlert[]> {
    if (status) return db.select().from(regulatoryAlerts).where(eq(regulatoryAlerts.status, status)).orderBy(desc(regulatoryAlerts.publishedDate));
    return db.select().from(regulatoryAlerts).orderBy(desc(regulatoryAlerts.publishedDate));
  }

  async createRegulatoryAlert(alert: InsertRegulatoryAlert): Promise<RegulatoryAlert> {
    const [newAlert] = await db.insert(regulatoryAlerts).values(alert).returning();
    return newAlert;
  }
}

export const storage = new DatabaseStorage();
