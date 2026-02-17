import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
export * from "./models/chat";

// === TABLE DEFINITIONS ===

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  annualBudget: doublePrecision("annual_budget"),
  status: text("status").notNull().default("active"), // active, inactive, onboarding
  createdAt: timestamp("created_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  vendorName: text("vendor_name").notNull(),
  productService: text("product_service").notNull(),
  category: text("category").notNull(), // endpoint_protection, etc.
  annualCost: doublePrecision("annual_cost"),
  monthlyCost: doublePrecision("monthly_cost"),
  contractStartDate: date("contract_start_date"),
  renewalDate: date("renewal_date"),
  contractTermMonths: integer("contract_term_months"),
  licenseCount: integer("license_count"),
  autoRenewal: boolean("auto_renewal").default(false),
  paymentFrequency: text("payment_frequency"), // monthly, quarterly, annual
  fileUrl: text("file_url"),
  status: text("status").default("active"), // active, expired, reviewing
  
  // Structured AI analysis results
  aiAnalysis: jsonb("ai_analysis").$type<{
    extractedDates?: Record<string, string>;
    slaMetrics?: Record<string, string>;
    dataPrivacy?: Record<string, string>;
    dpaAnalysis?: Record<string, string>;
    securityIncidentProvisions?: Record<string, string>;
    kdpaSpecificAnalysis?: Record<string, string>;
    riskFlags?: string[];
    summary?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complianceAudits = pgTable("compliance_audits", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id), // Can be null if audit covers multiple
  auditName: text("audit_name").notNull(),
  auditType: text("audit_type").notNull(), // manual, automated, scheduled
  scope: jsonb("scope").$type<{
    contractIds: number[];
    standards: string[]; // KDPA, CBK, GDPR, etc.
    categories: string[];
  }>(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, failed
  overallComplianceScore: doublePrecision("overall_compliance_score"), // 0-100
  
  // Detailed findings
  findings: jsonb("findings").$type<Array<{
    severity: "critical" | "high" | "medium" | "low";
    description: string;
    recommendation: string;
    standard?: string;
    section?: string;
  }>>(),
  
  complianceByStandard: jsonb("compliance_by_standard").$type<Record<string, number>>(),
  systemicIssues: jsonb("systemic_issues").$type<string[]>(),
  executiveSummary: text("executive_summary"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  riskTitle: text("risk_title").notNull(),
  riskCategory: text("risk_category").notNull(), // compliance, financial, operational, etc.
  riskDescription: text("risk_description"),
  severity: text("severity").notNull(), // critical, high, medium, low
  likelihood: text("likelihood").notNull(), // very_high, high, medium, low, very_low
  impact: text("impact").notNull(), // very_high, high, medium, low, very_low
  riskScore: integer("risk_score"), // 0-100
  mitigationStatus: text("mitigation_status").notNull().default("identified"), // identified, mitigation_planned, in_progress, mitigated, accepted
  
  mitigationStrategies: jsonb("mitigation_strategies").$type<Array<{
    strategy: string;
    priority: string;
    cost?: string;
    timeline?: string;
  }>>(),
  
  financialExposureMin: doublePrecision("financial_exposure_min"),
  financialExposureMax: doublePrecision("financial_exposure_max"),
  aiConfidence: integer("ai_confidence"), // 0-100
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const clauseLibrary = pgTable("clause_library", {
  id: serial("id").primaryKey(),
  clauseName: text("clause_name").notNull(),
  clauseCategory: text("clause_category").notNull(), // data_protection, liability, etc.
  standardLanguage: text("standard_language").notNull(),
  jurisdiction: text("jurisdiction"), // kenya, east_africa, international
  applicableStandards: jsonb("applicable_standards").$type<string[]>(),
  riskLevelIfMissing: text("risk_level_if_missing"), // critical, high, medium, low
  isMandatory: boolean("is_mandatory").default(false),
});

export const savingsOpportunities = pgTable("savings_opportunities", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // consolidation, pricing, license_optimization
  estimatedSavings: doublePrecision("estimated_savings"),
  status: text("status").default("identified"), // identified, in_progress, realized, dismissed
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const clientsRelations = relations(clients, ({ many }) => ({
  contracts: many(contracts),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  client: one(clients, {
    fields: [contracts.clientId],
    references: [clients.id],
  }),
  risks: many(risks),
  savingsOpportunities: many(savingsOpportunities),
}));

export const risksRelations = relations(risks, ({ one }) => ({
  contract: one(contracts, {
    fields: [risks.contractId],
    references: [contracts.id],
  }),
}));

export const savingsRelations = relations(savingsOpportunities, ({ one }) => ({
  contract: one(contracts, {
    fields: [savingsOpportunities.contractId],
    references: [contracts.id],
  }),
}));

// === INSERTS & TYPES ===

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertComplianceAuditSchema = createInsertSchema(complianceAudits).omit({ id: true, createdAt: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true });
export const insertClauseSchema = createInsertSchema(clauseLibrary).omit({ id: true });
export const insertSavingsSchema = createInsertSchema(savingsOpportunities).omit({ id: true, createdAt: true });

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type ComplianceAudit = typeof complianceAudits.$inferSelect;
export type InsertComplianceAudit = z.infer<typeof insertComplianceAuditSchema>;

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export type Clause = typeof clauseLibrary.$inferSelect;
export type InsertClause = z.infer<typeof insertClauseSchema>;

export type SavingsOpportunity = typeof savingsOpportunities.$inferSelect;
export type InsertSavings = z.infer<typeof insertSavingsSchema>;
