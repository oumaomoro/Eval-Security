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
  insertVendorScorecardSchema,
  clients,
  contracts,
  auditRulesets,
  complianceAudits,
  risks,
  clauseLibrary,
  savingsOpportunities,
  reports,
  vendorScorecards,
  workspaces,
  comments,
  contractComparisons,
  infrastructureLogs,
  billingTelemetry,
  auditLogs,
  users
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
    comparisons: {
      list: {
        method: 'GET' as const,
        path: '/api/contracts/:id/comparisons' as const,
        responses: {
          200: z.array(z.custom<typeof contractComparisons.$inferSelect>()),
        },
      },
      compare: {
        method: "POST" as const,
        path: "/api/contracts/:id/compare" as const,
        input: z.object({
          comparisonType: z.string(),
        }),
        responses: {
          201: z.custom<typeof contractComparisons.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      multi: {
        method: "POST" as const,
        path: "/api/contracts/:id/compare/multi" as const,
        input: z.object({
          standards: z.array(z.string()),
        }),
        responses: {
          201: z.array(z.custom<typeof contractComparisons.$inferSelect>()),
          400: errorSchemas.validation,
        },
      },
    },
    remediate: {
      method: "POST" as const,
      path: "/api/contracts/:id/remediate" as const,
      input: z.object({
        riskId: z.number(),
        originalText: z.string(),
      }),
      responses: {
        200: z.object({
          suggestedText: z.string(),
          explanation: z.string(),
        }),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
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
  auditRulesets: {
    list: {
      method: "GET" as const,
      path: "/api/audit-rulesets" as const,
      responses: {
        200: z.array(z.custom<typeof auditRulesets.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/audit-rulesets" as const,
      input: z.object({
        name: z.string(),
        description: z.string().optional(),
        standard: z.string(),
        rules: z.array(z.object({
          id: z.string(),
          requirement: z.string(),
          description: z.string(),
          severity: z.enum(["critical", "high", "medium", "low"]),
        })),
        isCustom: z.boolean().optional(),
      }),
      responses: {
        201: z.custom<typeof auditRulesets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/audit-rulesets/:id" as const,
      input: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        standard: z.string().optional(),
        rules: z.array(z.object({
          id: z.string(),
          requirement: z.string(),
          description: z.string(),
          severity: z.enum(["critical", "high", "medium", "low"]),
        })).optional(),
      }),
      responses: {
        200: z.custom<typeof auditRulesets.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/audit-rulesets/:id" as const,
      responses: {
        204: z.null(),
        404: errorSchemas.notFound,
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
    generate: {
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
    evidencePack: {
      method: 'POST' as const,
      path: '/api/reports/evidence-pack' as const,
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        500: errorSchemas.internal,
      },
    },
    export: {
      method: 'GET' as const,
      path: '/api/reports/:id/export' as const,
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
  },
  vendors: {
    scorecards: {
      list: {
        method: 'GET' as const,
        path: '/api/vendors/scorecards' as const,
        input: z.object({
          vendorName: z.string().optional(),
        }).optional(),
        responses: {
          200: z.array(z.custom<typeof vendorScorecards.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/vendors/scorecards' as const,
        input: insertVendorScorecardSchema,
        responses: {
          201: z.custom<typeof vendorScorecards.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
    benchmarks: {
      method: 'GET' as const,
      path: '/api/vendors/benchmarks' as const,
      responses: {
        200: z.array(z.object({
          vendor: z.string(),
          avgCompliance: z.number(),
          avgCost: z.number(),
          riskScore: z.number(),
        })),
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
      responses: {
        200: z.object({
          subscriptionTier: z.string().optional(),
          contractsCount: z.number().optional(),
          totalContracts: z.number(),
          totalAnnualCost: z.number(),
          totalPotentialSavings: z.number(),
          avgComplianceScore: z.number(),
          criticalRisks: z.number(),
          upcomingRenewals: z.array(z.custom<typeof contracts.$inferSelect>()),
          costByVendor: z.array(z.object({ vendor: z.string(), cost: z.number() })),
          complianceTrends: z.array(z.object({ month: z.string(), score: z.number() })),
          riskHeatmap: z.array(z.object({ category: z.string(), count: z.number() })),
          technicalMetrics: z.object({
            apiResponseTimeAvgMs: z.number(),
            aiAccuracyRate: z.number(),
            systemUptime: z.number(),
            errorRate: z.number(),
            userEngagement: z.number(),
          }).optional(),
          businessMetrics: z.object({
            mrr: z.number(),
            cac: z.number(),
            ltv: z.number(),
            churnRate: z.number(),
            nps: z.number(),
            totalEconomicImpact: z.number().optional(),
            roiRatio: z.number().optional(),
            efficiencySavings: z.number().optional(),
            riskMitigationValue: z.number().optional(),
          }).optional(),
          userMetrics: z.object({
            contractsAnalyzedPerMonth: z.number(),
            complianceScoreImprovement: z.number(),
            savingsOpportunitiesIdentified: z.number(),
            risksMitigated: z.number(),
            timeSavedHours: z.number(),
          }).optional(),
          remediationLog: z.array(z.object({
            id: z.number(),
            action: z.string(),
            target: z.string(),
            status: z.string(),
            timestamp: z.string()
          })).optional(),
          roi_details: z.object({
            total_savings: z.number(),
            implementation_cost: z.number(),
            net_benefit: z.number(),
            payback_months: z.number(),
            efficiency_gain: z.number(),
            total_impact: z.number(),
            efficiency_savings: z.number(),
            direct_savings: z.number(),
            hours_saved: z.number(),
            mitigated_exposure: z.number(),
            roi_ratio: z.number(),
          }).optional(),
        }),
      },
    },
  },
  comments: {
    list: {
      method: 'GET' as const,
      path: '/api/comments' as const,
      input: z.object({
        contractId: z.string().optional(),
        auditId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof comments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/comments' as const,
      input: z.object({
        contractId: z.number().optional(),
        auditId: z.number().optional(),
        content: z.string(),
      }),
      responses: {
        201: z.custom<typeof comments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  workspaces: {
    list: {
      method: 'GET' as const,
      path: '/api/workspaces' as const,
      responses: {
        200: z.array(z.custom<typeof workspaces.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workspaces' as const,
      input: z.object({
        name: z.string(),
        description: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof workspaces.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    members: {
      listByWorkspace: {
        method: 'GET' as const,
        path: '/api/workspaces/:workspaceId/members' as const,
        responses: {
          200: z.array(z.custom<typeof users.$inferSelect & { workspaceRole: string }>()),
        },
      },
      addToWorkspace: {
        method: 'POST' as const,
        path: '/api/workspaces/:workspaceId/members' as const,
        input: z.object({
          userId: z.string(),
          role: z.string(),
        }),
        responses: {
          201: z.any(),
          400: errorSchemas.validation,
        },
      },
      removeFromWorkspace: {
        method: 'DELETE' as const,
        path: '/api/workspaces/:workspaceId/members/:userId' as const,
        responses: {
          200: z.any(),
          404: errorSchemas.notFound,
        },
      },
      list: {
        method: 'GET' as const,
        path: '/api/org/members' as const,
        responses: {
          200: z.array(z.custom<typeof users.$inferSelect>()),
        },
      },
      invite: {
        method: 'POST' as const,
        path: '/api/org/invite' as const,
        input: z.object({
          email: z.string().email(),
          role: z.string(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        }),
        responses: {
          201: z.custom<typeof users.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      updateRole: {
        method: 'PUT' as const,
        path: '/api/org/member' as const,
        input: z.object({
          userId: z.string(),
          role: z.string(),
        }),
        responses: {
          200: z.custom<typeof users.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
        },
      },
    },
  },
  infrastructure: {
    logs: {
      method: 'GET' as const,
      path: '/api/infrastructure/logs' as const,
      responses: {
        200: z.array(z.custom<typeof infrastructureLogs.$inferSelect>()),
      },
    },
    heal: {
      method: 'POST' as const,
      path: '/api/infrastructure/heal' as const,
      input: z.object({
        logId: z.number(),
      }),
      responses: {
        200: z.custom<typeof infrastructureLogs.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  billing: {
    telemetry: {
      method: 'GET' as const,
      path: '/api/billing/telemetry' as const,
      input: z.object({
        clientId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof billingTelemetry.$inferSelect>()),
      },
    },
  },
  system: {
    health: {
      method: "GET" as const,
      path: "/api/health" as const,
      responses: {
        200: z.object({
          status: z.string(),
          dbStatus: z.string(),
          postgresLatency: z.number(),
          pulseAgeMs: z.number(),
          version: z.string(),
        }),
      },
    },
  },
  governance: {
    posture: {
      method: "GET" as const,
      path: "/api/governance/posture" as const,
      responses: {
        200: z.object({
          overallStatus: z.enum(["Optimal", "Caution", "Critical"]),
          resilienceIndex: z.number(),
          complianceHealth: z.number(),
          executiveSummary: z.string(),
          topRecommendations: z.array(z.string()),
          predictiveAnalysis: z.string(),
        }),
      },
    },
  },
  auditLogs: {
    list: {
      method: "GET" as const,
      path: "/api/audit-logs" as const,
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect>()),
      },
    },
  },
  auth: {
    apiKey: {
      rotate: {
        method: "POST" as const,
        path: "/api/auth/api-key" as const,
        responses: {
          200: z.object({ apiKey: z.string() }),
          401: errorSchemas.validation,
        },
      },
    },
  },
  integrations: {
    word: {
      analyze: {
        method: "POST" as const,
        path: "/api/integrations/word/analyze" as const,
        input: z.object({ textBlock: z.string() }),
        responses: {
          200: z.object({
            riskScore: z.number(),
            complianceStatus: z.string(),
            leveragePoints: z.array(z.string()),
            findings: z.array(z.object({
              requirement: z.string(),
              severity: z.string(),
              description: z.string(),
            })),
          }),
          401: errorSchemas.validation,
          500: errorSchemas.internal,
        },
      },
      publish: {
        method: "POST" as const,
        path: "/api/integrations/word/publish" as const,
        input: z.object({
          clauseName: z.string(),
          clauseCategory: z.string(),
          standardLanguage: z.string(),
          riskLevelIfMissing: z.string().optional(),
        }),
        responses: {
          201: z.object({
            success: z.boolean(),
            clause: z.custom<typeof clauseLibrary.$inferSelect>(),
            message: z.string(),
          }),
          401: errorSchemas.validation,
          500: errorSchemas.internal,
        },
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
