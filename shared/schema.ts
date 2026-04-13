import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, doublePrecision, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";
export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'admin', 'editor', 'viewer']);

// === TABLE DEFINITIONS ===

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").references(() => users.id),
  plan: text("plan").notNull().default("enterprise"),
  webhookUrl: text("webhook_url"),
  webhookEnabled: boolean("webhook_enabled").default(false),
  apiUsageCount: integer("api_usage_count").default(0),
  apiUsageResetDate: timestamp("api_usage_reset_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaceMembers = pgTable('workspace_members', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  role: workspaceRoleEnum('role').notNull().default('viewer'),
  permissions: jsonb('permissions').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});


export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  annualBudget: doublePrecision("annual_budget"),
  status: text("status").notNull().default("active"), // active, inactive, onboarding
  riskThreshold: integer("risk_threshold").default(70),
  complianceFocus: text("compliance_focus").default("KDPA"),
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
    riskScore?: number;
    summary?: string;
    remediationStatus?: 'pending' | 'in_progress' | 'completed' | 'none';
    remediationAddendum?: string;
    legalAlignmentScore?: number;
    remediatedAt?: string;
  }>(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditRulesets = pgTable("audit_rulesets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  standard: text("standard").notNull(), // PCI DSS, CCPA, GDPR, Custom, etc.
  rules: jsonb("rules").$type<Array<{
    id: string;
    requirement: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low";
  }>>().notNull(),
  isCustom: boolean("is_custom").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const complianceAudits = pgTable("compliance_audits", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id),
  rulesetId: integer("ruleset_id").references(() => auditRulesets.id),
  auditName: text("audit_name").notNull(),
  auditType: text("audit_type").notNull(), // manual, automated, scheduled, continuous
  scope: jsonb("scope").$type<{
    contractIds: number[];
    standards: string[]; // KDPA, CBK, GDPR, PCI DSS, CCPA, etc.
    categories: string[];
  }>(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, failed
  overallComplianceScore: doublePrecision("overall_compliance_score"), // 0-100

  // Detailed findings
  findings: jsonb("findings").$type<Array<{
    id: string;
    requirement: string;
    description: string;
    status: "compliant" | "non_compliant" | "not_applicable" | "partial";
    evidence: string;
    severity?: "critical" | "high" | "medium" | "low";
    remediation?: string;
    jurisdiction?: string;
  }>>(),

  // High-fidelity executive reporting
  complianceByStandard: jsonb("compliance_by_standard").$type<Record<string, number>>(),
  systemicIssues: jsonb("systemic_issues").$type<string[]>(),
  executiveSummary: text("executive_summary"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  riskTitle: text("risk_title").notNull(),
  riskCategory: text("risk_category").notNull(), // security, financial, operational, legal
  riskDescription: text("risk_description"),
  severity: text("severity").notNull(), // low, medium, high, critical
  likelihood: text("likelihood").notNull(), // rare, unlikely, possible, likely, almost_certain
  impact: text("impact").notNull(), // minimal, minor, moderate, major, very_high
  riskScore: integer("risk_score"), // Calculated (1-25)

  mitigationStatus: text("mitigation_status").notNull().default("identified"), // identified, in_progress, mitigated, accepted
  mitigationStrategies: jsonb("mitigation_strategies").$type<string[]>(),

  // Advanced Forensic Fields
  financialExposureMin: doublePrecision("financial_exposure_min"),
  financialExposureMax: doublePrecision("financial_exposure_max"),
  aiConfidence: integer("ai_confidence"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const clauseLibrary = pgTable("clause_library", {
  id: serial("id").primaryKey(),
  clauseName: text("clause_name").notNull(),
  clauseCategory: text("clause_category").notNull(),
  standardLanguage: text("standard_language").notNull(),
  jurisdiction: text("jurisdiction"),
  applicableStandards: jsonb("applicable_standards").$type<string[]>(),
  riskLevelIfMissing: text("risk_level_if_missing"),
  isMandatory: boolean("is_mandatory").default(false),
});

export const savingsOpportunities = pgTable("savings_opportunities", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  estimatedSavings: doublePrecision("estimated_savings"),
  status: text("status").default("identified"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  organizationId: text("organization_id"),
  title: text("title").notNull(),
  type: text("type").notNull(),
  regulatoryBody: text("regulatory_body"),
  status: text("status").notNull().default("pending"),
  aiAnalysis: jsonb("ai_analysis").$type<{
    strategic_brief?: string;
    total_portfolio_risk?: number;
    contracts_summarized?: number;
    savings_potential?: number;
    remediation_confidence?: number;
  }>(),
  content: jsonb("content"), // Keep for compatibility
  format: text("format").notNull().default("pdf"),
  fileUrl: text("file_url"),
  generatedBy: text("generated_by"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendorScorecards = pgTable("vendor_scorecards", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  vendorName: text("vendor_name").notNull(),
  complianceScore: integer("compliance_score"),
  riskScore: integer("risk_score"),
  securityScore: integer("security_score"),
  slaPerformance: integer("sla_performance"),
  overallGrade: text("overall_grade"),
  lastAssessmentDate: timestamp("last_assessment_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const remediationSuggestions = pgTable("remediation_suggestions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  originalClause: text("original_clause").notNull(),
  suggestedClause: text("suggested_clause").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

export const playbooks = pgTable("playbooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  rules: jsonb("rules").$type<string[]>().notNull(),
  isActive: boolean("is_active").default(true),
});

export const userPlaybooks = pgTable("user_playbooks", {
  userId: text("user_id").references(() => users.id).notNull(),
  playbookId: integer("playbook_id").references(() => playbooks.id).notNull(),
  activatedAt: timestamp("activated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  contractId: integer("contract_id").references(() => contracts.id),
  auditId: integer("audit_id").references(() => complianceAudits.id),
  content: text("content").notNull(),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contractComparisons = pgTable("contract_comparisons", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  comparisonType: text("comparison_type").notNull(), // market, internal, template
  overallScore: integer("overall_score"),
  clauseAnalysis: jsonb("clause_analysis").$type<any>(),
  missingClauses: jsonb("missing_clauses").$type<string[]>(),
  keyRecommendations: jsonb("key_recommendations").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const regulatoryAlerts = pgTable("regulatory_alerts", {
  id: serial("id").primaryKey(),
  standard: text("standard").notNull(),
  alertTitle: text("alert_title").notNull(),
  alertDescription: text("alert_description").notNull(),
  publishedDate: timestamp("published_date").defaultNow(),
  status: text("status").notNull().default("pending_rescan"),
});

export const infrastructureLogs = pgTable("infrastructure_logs", {
  id: serial("id").primaryKey(),
  component: text("component").notNull(),
  event: text("event").notNull(),
  status: text("status").notNull().default("detected"), // detected, analyzing, self_healing, resolved
  actionTaken: text("action_taken"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const billingTelemetry = pgTable("billing_telemetry", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  metricType: text("metric_type").notNull(), // api_call, storage_gb, audit_runtime
  value: doublePrecision("value").notNull(),
  cost: doublePrecision("cost"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const clauses = pgTable("clauses", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  riskLevel: text("risk_level").notNull().default("low"),
  category: text("category").notNull(),
  isStandard: boolean("is_standard").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});


// === DATABASE RELATIONS ===

export const clientsRelations = relations(clients, ({ many }) => ({
  contracts: many(contracts),
  audits: many(auditLogs),
  billing: many(billingTelemetry),
}));

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  client: one(clients, { fields: [contracts.clientId], references: [clients.id] }),
  complianceAudits: many(complianceAudits),
  risks: many(risks),
  savingsOpportunities: many(savingsOpportunities),
  scorecards: many(vendorScorecards),
  comments: many(comments),
  comparisons: many(contractComparisons),
  clauses: many(clauses),
}));

export const auditRulesetsRelations = relations(auditRulesets, ({ many }) => ({
  audits: many(complianceAudits),
}));

export const complianceAuditsRelations = relations(complianceAudits, ({ one, many }) => ({
  contract: one(contracts, { fields: [complianceAudits.contractId], references: [contracts.id] }),
  ruleset: one(auditRulesets, { fields: [complianceAudits.rulesetId], references: [auditRulesets.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  contract: one(contracts, { fields: [comments.contractId], references: [contracts.id] }),
  audit: one(complianceAudits, { fields: [comments.auditId], references: [complianceAudits.id] }),
}));

// === SCHEMA DEFINITIONS ===

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuditRulesetSchema = createInsertSchema(auditRulesets).omit({ id: true, createdAt: true });
export const insertComplianceAuditSchema = createInsertSchema(complianceAudits).omit({ id: true, createdAt: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true });

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type AuditRuleset = typeof auditRulesets.$inferSelect;
export type InsertAuditRuleset = z.infer<typeof insertAuditRulesetSchema>;

export type ComplianceAudit = typeof complianceAudits.$inferSelect;
export type InsertComplianceAudit = z.infer<typeof insertComplianceAuditSchema>;

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export const insertClauseSchema = createInsertSchema(clauseLibrary).omit({ id: true });
export const insertSavingsSchema = createInsertSchema(savingsOpportunities).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
export const insertVendorScorecardSchema = createInsertSchema(vendorScorecards).omit({ id: true, createdAt: true });
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

export type Clause = typeof clauseLibrary.$inferSelect;
export type InsertClause = z.infer<typeof insertClauseSchema>;

export type SavingsOpportunity = typeof savingsOpportunities.$inferSelect;
export type InsertSavings = z.infer<typeof insertSavingsSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type VendorScorecard = typeof vendorScorecards.$inferSelect;
export type InsertVendorScorecard = z.infer<typeof insertVendorScorecardSchema>;

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export const insertContractComparisonSchema = createInsertSchema(contractComparisons).omit({ id: true, createdAt: true });
export type ContractComparison = typeof contractComparisons.$inferSelect;
export type InsertContractComparison = z.infer<typeof insertContractComparisonSchema>;

export const insertInfrastructureLogSchema = createInsertSchema(infrastructureLogs).omit({ id: true, timestamp: true });
export type InfrastructureLog = typeof infrastructureLogs.$inferSelect;
export type InsertInfrastructureLog = z.infer<typeof insertInfrastructureLogSchema>;

export const insertBillingTelemetrySchema = createInsertSchema(billingTelemetry).omit({ id: true, timestamp: true });
export type BillingTelemetry = typeof billingTelemetry.$inferSelect;
export type InsertBillingTelemetry = z.infer<typeof insertBillingTelemetrySchema>;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertRemediationSuggestionSchema = createInsertSchema(remediationSuggestions).omit({ id: true, createdAt: true });
export type RemediationSuggestion = typeof remediationSuggestions.$inferSelect;
export type InsertRemediationSuggestion = z.infer<typeof insertRemediationSuggestionSchema>;

export const insertPlaybookSchema = createInsertSchema(playbooks).omit({ id: true, isActive: true });
export type Playbook = typeof playbooks.$inferSelect;
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;

export const insertUserPlaybookSchema = createInsertSchema(userPlaybooks).omit({ activatedAt: true });
export type UserPlaybook = typeof userPlaybooks.$inferSelect;
export type InsertUserPlaybook = z.infer<typeof insertUserPlaybookSchema>;

export const insertRegulatoryAlertSchema = createInsertSchema(regulatoryAlerts).omit({ id: true, publishedDate: true });
export type RegulatoryAlert = typeof regulatoryAlerts.$inferSelect;
export type InsertRegulatoryAlert = z.infer<typeof insertRegulatoryAlertSchema>;

export const insertContractClauseSchema = createInsertSchema(clauses).omit({ id: true, createdAt: true });
export type ContractClause = typeof clauses.$inferSelect;
export type InsertContractClause = z.infer<typeof insertContractClauseSchema>;

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({ id: true, createdAt: true });
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
