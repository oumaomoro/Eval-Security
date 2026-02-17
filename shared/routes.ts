import { z } from 'zod';
import { 
  insertClientSchema, 
  insertContractSchema, 
  insertAuditRulesetSchema,
  insertComplianceAuditSchema, 
  insertRiskSchema, 
  insertClauseSchema,
  insertSavingsSchema,
  insertReportSchema,
  clients,
  contracts,
  auditRulesets,
  complianceAudits,
  risks,
  clauseLibrary,
  savingsOpportunities,
  reports
} from './schema';

// === SHARED ERROR SCHEMAS ===
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// === API CONTRACT ===
export const api = {
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients' as const,
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients' as const,
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id' as const,
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  contracts: {
    list: {
      method: 'GET' as const,
      path: '/api/contracts' as const,
      input: z.object({
        clientId: z.string().optional(), // Passed as query param
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof contracts.$inferSelect & { client?: typeof clients.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contracts' as const,
      input: insertContractSchema,
      responses: {
        201: z.custom<typeof contracts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/contracts/:id' as const,
      responses: {
        200: z.custom<typeof contracts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    analyze: { // Trigger AI analysis
      method: 'POST' as const,
      path: '/api/contracts/:id/analyze' as const,
      responses: {
        200: z.custom<typeof contracts.$inferSelect>(),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
    upload: { // File upload handled separately, returns file metadata
      method: 'POST' as const,
      path: '/api/upload' as const,
      // Input is FormData (not strictly typed here but handled in server)
      responses: {
        200: z.object({
          url: z.string(),
          filename: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  compliance: {
    rulesets: {
      list: {
        method: 'GET' as const,
        path: '/api/compliance/rulesets' as const,
        responses: {
          200: z.array(z.custom<typeof auditRulesets.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/compliance/rulesets' as const,
        input: insertAuditRulesetSchema,
        responses: {
          201: z.custom<typeof auditRulesets.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/compliance-audits' as const,
      responses: {
        200: z.array(z.custom<typeof complianceAudits.$inferSelect>()),
      },
    },
    run: { // Trigger automated audit
      method: 'POST' as const,
      path: '/api/compliance-audits/run' as const,
      input: z.object({
        scope: z.object({
          contractIds: z.array(z.number()),
          standards: z.array(z.string()),
          rulesetId: z.number().optional(),
        }),
        auditType: z.enum(['manual', 'automated', 'scheduled', 'continuous']).optional(),
      }),
      responses: {
        201: z.custom<typeof complianceAudits.$inferSelect>(),
        500: errorSchemas.internal,
      },
    },
    monitoring: {
      method: 'GET' as const,
      path: '/api/compliance/monitoring' as const,
      responses: {
        200: z.array(z.object({
          contractId: z.number(),
          vendorName: z.string(),
          complianceScore: z.number(),
          lastAudit: z.string(),
          status: z.string(),
        })),
      },
    },
  },
  risks: {
    list: {
      method: 'GET' as const,
      path: '/api/risks' as const,
      input: z.object({
        contractId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof risks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/risks' as const,
      input: insertRiskSchema,
      responses: {
        201: z.custom<typeof risks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    mitigate: {
      method: 'PATCH' as const,
      path: '/api/risks/:id/mitigate' as const,
      input: z.object({
        status: z.string(),
        strategy: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof risks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  clauses: {
    list: {
      method: 'GET' as const,
      path: '/api/clause-library' as const,
      responses: {
        200: z.array(z.custom<typeof clauseLibrary.$inferSelect>()),
      },
    },
    generate: { // Generate new clause via AI
      method: 'POST' as const,
      path: '/api/clause-library/generate' as const,
      input: z.object({
        category: z.string(),
        requirements: z.string(),
        jurisdiction: z.string().optional(),
      }),
      responses: {
        200: z.object({
          clauseText: z.string(),
          explanation: z.string(),
        }),
        500: errorSchemas.internal,
      },
    },
  },
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports' as const,
      responses: {
        200: z.array(z.custom<typeof reports.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reports' as const,
      input: insertReportSchema,
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/reports/generate' as const,
      input: z.object({
        title: z.string(),
        type: z.string(),
        regulatoryBody: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        500: errorSchemas.internal,
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
      responses: {
        200: z.object({
          totalContracts: z.number(),
          totalAnnualCost: z.number(),
          avgComplianceScore: z.number(),
          criticalRisks: z.number(),
          upcomingRenewals: z.array(z.custom<typeof contracts.$inferSelect>()),
          costByVendor: z.array(z.object({ vendor: z.string(), cost: z.number() })),
          complianceTrends: z.array(z.object({ month: z.string(), score: z.number() })),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
