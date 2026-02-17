import { db } from "./db";
import { 
  clients, contracts, complianceAudits, risks, clauseLibrary, savingsOpportunities,
  type InsertClient, type InsertContract, type InsertComplianceAudit, 
  type InsertRisk, type InsertClause, type InsertSavings,
  type Client, type Contract, type ComplianceAudit, type Risk, type Clause, type SavingsOpportunity
} from "@shared/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;

  // Contracts
  getContracts(filters?: { clientId?: string, status?: string }): Promise<(Contract & { client?: Client })[]>;
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, updates: Partial<InsertContract> & { aiAnalysis?: any }): Promise<Contract>;
  
  // Compliance
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

  // Dashboard
  getDashboardStats(): Promise<any>;
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

  // Contracts
  async getContracts(filters?: { clientId?: string, status?: string }): Promise<(Contract & { client?: Client })[]> {
    let query = db.select().from(contracts).leftJoin(clients, eq(contracts.clientId, clients.id));
    
    // Simple in-memory filter or dynamic query building would be better, but sticking to basic drizzle for now
    // Note: Drizzle's query builder is more robust, but direct select() is simple.
    
    const results = await query;
    let mapped = results.map(r => ({ ...r.contracts, client: r.clients || undefined }));
    
    if (filters?.clientId) {
      mapped = mapped.filter(c => c.clientId === parseInt(filters.clientId!));
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

  // Dashboard
  async getDashboardStats(): Promise<any> {
    const [contractStats] = await db.select({
      count: sql<number>`count(*)`,
      totalCost: sql<number>`sum(${contracts.annualCost})`
    }).from(contracts);
    
    const [riskStats] = await db.select({
      criticalCount: sql<number>`count(*)`
    }).from(risks).where(eq(risks.severity, 'critical'));

    // Mock upcoming renewals for now (contracts expiring in next 90 days)
    const upcomingRenewals = await db.select().from(contracts)
      .limit(5)
      .orderBy(contracts.renewalDate);

    // Cost by vendor
    const costByVendor = await db.select({
      vendor: contracts.vendorName,
      cost: sql<number>`sum(${contracts.annualCost})`
    })
    .from(contracts)
    .groupBy(contracts.vendorName)
    .orderBy(sql`sum(${contracts.annualCost}) desc`)
    .limit(5);

    return {
      totalContracts: Number(contractStats.count),
      totalAnnualCost: Number(contractStats.totalCost || 0),
      avgComplianceScore: 85, // Placeholder until audits populated
      criticalRisks: Number(riskStats.criticalCount),
      upcomingRenewals,
      costByVendor: costByVendor.map(c => ({ vendor: c.vendor, cost: Number(c.cost) })),
    };
  }
}

export const storage = new DatabaseStorage();
