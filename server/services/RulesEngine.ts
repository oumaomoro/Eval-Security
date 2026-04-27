import { storage } from "../storage.js";
import { type Contract, type PlaybookRule } from "../../shared/schema.js";
import { RedlineEngine } from "./RedlineEngine.js";

export class RulesEngine {
  /**
   * Applies all active playbook rules to a specific contract.
   * Typically invoked synchronously right after IntelligenceGateway analysis completes.
   */
  static async evaluateContract(contractId: number, workspaceId: number): Promise<void> {
    console.log(`[RulesEngine] Starting evaluation for contract ID ${contractId}`);
    
    // 1. Fetch Contract & Playbooks in parallel
    const [contract, playbooks] = await Promise.all([
      storage.getContract(contractId),
      storage.getPlaybooks()
    ]);

    if (!contract || !contract.intelligenceAnalysis) {
      console.warn(`[RulesEngine] Contract ${contractId} has no intelligence analysis. Skipping rules evaluation.`);
      return;
    }
    
    // 2. Filter Active Playbooks for the Workspace
    const activePlaybooks = playbooks.filter(pb => pb.isActive && pb.workspaceId === workspaceId);
    
    if (activePlaybooks.length === 0) {
      console.log(`[RulesEngine] No active playbooks found for workspace ${workspaceId}.`);
      return;
    }
    
    // 3. Batch Fetch all active rules
    const playbookIds = activePlaybooks.map(pb => pb.id);
    const rules = await storage.getRulesForPlaybooks(playbookIds);
    const allRules = rules.filter(r => r.isActive);
    
    // Sort rules by priority (highest first)
    allRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    console.log(`[RulesEngine] Loaded ${allRules.length} active rules for evaluation.`);
    
    const contextMap = this.flattenObject(contract.intelligenceAnalysis);

    const actionPromises: Promise<void>[] = [];

    for (const rule of allRules) {
      try {
        const isTriggered = this.evaluateCondition(rule.condition, contextMap);
        if (isTriggered) {
          console.log(`[RulesEngine] [✓] TRIGGERED: [${rule.name}] (Rule ID: ${rule.id})`);
          // Queue the action for concurrent execution
          actionPromises.push(this.executeAction(rule, contract));
        } else {
          console.log(`[RulesEngine] [ ] Skipped: [${rule.name}] (Condition not met)`);
        }
      } catch (err: any) {
        console.error(`[RulesEngine] [!] Error evaluating rule [${rule.name}]:`, err.message);
      }
    }

    // Execute all triggered rule actions concurrently to eliminate database bottleneck
    if (actionPromises.length > 0) {
      await Promise.allSettled(actionPromises);
    }

    // 4. Temporal Risk Forecasting (Phase 27)
    await this.checkTemporalRisks(contract);
    
    console.log(`[RulesEngine] Evaluation complete for contract ID ${contractId}`);
  }

  /**
   * Forecasts future risks based on temporal data (e.g., upcoming renewals vs regulatory shifts)
   */
  private static async checkTemporalRisks(contract: Contract): Promise<void> {
    if (!contract.renewalDate) return;

    const renewal = new Date(contract.renewalDate);
    const now = new Date();
    const monthsUntilRenewal = (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // If renewal is within 6 months, flag for "Compliance Drift" assessment
    if (monthsUntilRenewal > 0 && monthsUntilRenewal <= 6) {
      console.log(`[RulesEngine] [TEMPORAL] Forecasting compliance drift for ${contract.vendorName} (Renewal in ${Math.round(monthsUntilRenewal)} months)`);
      
      await storage.createRisk({
        workspaceId: contract.workspaceId!,
        contractId: contract.id,
        riskTitle: `[Forecasting] Upcoming Renewal Compliance Drift`,
        riskCategory: "strategic",
        riskDescription: `Contract renewal is in ${Math.round(monthsUntilRenewal)} months. Recommend proactive audit against 2026 Sovereign Data Standards to prevent legacy lock-in.`,
        severity: "medium",
        likelihood: "likely",
        impact: "moderate",
        mitigationStatus: "identified"
      });
    }
  }

  /**
   * Evaluates the JSON condition against a flattened key-value context map.
   */
  private static evaluateCondition(condition: any, context: Record<string, any>): boolean {
    const { field, operator, value } = condition;
    
    if (!field || !operator) {
      return false;
    }

    // Try to resolve exactly, or fall back to searching keys ending with the field
    let targetData = context[field];
    
    if (targetData === undefined) {
      // Fuzzy extraction if nested object keys were passed
       const keys = Object.keys(context).filter(k => k.includes(field) || k.toLowerCase().includes(field.toLowerCase()));
       if (keys.length > 0) {
          targetData = context[keys[0]]; // Grab first match
       }
    }

    switch (operator) {
      case "exists":
        return targetData !== undefined && targetData !== null && targetData !== "";
      case "not_exists":
        return targetData === undefined || targetData === null || targetData === "";
      case "equals":
        return String(targetData).toLowerCase() === String(value).toLowerCase();
      case "not_equals":
        return String(targetData).toLowerCase() !== String(value).toLowerCase();
      case "contains":
        return Array.isArray(targetData) 
          ? targetData.some(item => String(item).toLowerCase().includes(String(value).toLowerCase()))
          : String(targetData).toLowerCase().includes(String(value).toLowerCase());
      case "not_contains":
        return Array.isArray(targetData)
          ? !targetData.some(item => String(item).toLowerCase().includes(String(value).toLowerCase()))
          : !String(targetData).toLowerCase().includes(String(value).toLowerCase());
      case "greaterThan":
        return Number(targetData) > Number(value);
      case "lessThan":
        return Number(targetData) < Number(value);
      default:
        console.warn(`[RulesEngine] Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Executes the action defined in the playbook rule.
   */
  private static async executeAction(rule: PlaybookRule, contract: Contract): Promise<void> {
    const action = rule.action;
    if (!action || !action.type) return;

    try {
      switch (action.type) {
        case "suggestClause":
          // Delagate explicit clause remediation to the specialized RedlineEngine
          if (action.clauseId) {
            await RedlineEngine.generateSuggestionFromClauseId(contract.id, contract.workspaceId!, action.clauseId, rule.id);
          } else if (action.message) {
            await RedlineEngine.generateGenericSuggestion(contract.id, contract.workspaceId!, action.message, rule.id);
          }
          break;

        case "createTask":
          await storage.createRemediationTask({
            workspaceId: contract.workspaceId!,
            contractId: contract.id,
            title: `[Automated] ${rule.name}`,
            severity: action.severity || "medium",
            description: action.message || `Triggered by rule ${rule.name}`,
            gapDescription: `Triggered by Playbook Rule: ${rule.name} (${rule.condition.field} ${rule.condition.operator} ${rule.condition.value})`
          });
          break;

        case "updateRisk":
          await storage.createRisk({
            workspaceId: contract.workspaceId!,
            contractId: contract.id,
            riskTitle: `[Rule Detected] ${rule.name}`,
            riskCategory: "legal", // Defaulting for playbook compliance
            riskDescription: action.message || "Rule triggered missing provision",
            severity: action.severity || "low",
            likelihood: "high",
            impact: "moderate",
            mitigationStatus: "identified"
          });
          break;

        case "sendNotification":
          // To be wired to standard websocket/webhook integrations later
          console.log(`[RulesEngine] Triggering Notification Action: ${action.message}`);
          break;

        default:
          console.warn(`[RulesEngine] Unknown action type: ${action.type}`);
      }

      // Track rule execution in the audit log
      await storage.createAuditLog({
        action: "RULE_TRIGGERED",
        userId: "SYSTEM",
        clientId: contract.clientId,
        resourceType: "contract",
        resourceId: String(contract.id),
        details: `Rule '${rule.name}' triggered action: ${action.type}`,
      });
    } catch (err: any) {
      console.error(`[RulesEngine] Failed to execute action ${action.type} for rule ${rule.id}:`, err);
    }
  }

  /**
   * Flattens a nested object map down to a single layer key map to allow dot-notation or explicit field targeting.
   */
  private static flattenObject(ob: any): Record<string, any> {
    var toReturn: Record<string, any> = {};
    for (var i in ob) {
      if (!ob.hasOwnProperty(i)) continue;
      if ((typeof ob[i]) == 'object' && ob[i] !== null && !Array.isArray(ob[i])) {
        var flatObject = this.flattenObject(ob[i]);
        for (var x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;
          toReturn[i + '.' + x] = flatObject[x];
        }
      } else {
        toReturn[i] = ob[i];
      }
    }
    return toReturn;
  }
}
