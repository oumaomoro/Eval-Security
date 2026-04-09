import { supabase } from './supabase.service.js';

/**
 * Cost Optimizer Service
 * Analyzes contract spending vs market benchmarks to identify ROI opportunities.
 */
export class CostOptimizerService {
  /**
   * Run optimization for a specific contract
   */
  static async optimizeContract(contractId, userId) {
    try {
      // 1. Fetch Contract & Category
      const { data: contract, error: contractErr } = await supabase
        .from('contracts')
        .select('id, vendor_name, annual_cost, detected_sector')
        .eq('id', contractId)
        .single();

      if (contractErr || !contract) return;

      // 2. Fetch Benchmark for the category/sector
      // Sector mapping for better matching
      const category = this.mapSectorToBenchmark(contract.detected_sector);

      const { data: benchmark, error: benchErr } = await supabase
        .from('market_benchmarks')
        .select('*')
        .eq('category', category)
        .limit(1)
        .single();

      if (benchErr || !benchmark) return;

      // 3. Compare and Calculate Savings
      // If actual cost > benchmark, there is a saving opportunity
      const actual = Number(contract.annual_cost) || 0;
      const target = Number(benchmark.avg_annual_cost);

      if (actual > target) {
        const potentialSavings = actual - target;

        // 4. Store in savings_opportunities
        await supabase.from('savings_opportunities').upsert({
          user_id: userId,
          contract_id: contractId,
          category: category,
          current_cost: actual,
          benchmark_cost: target,
          potential_savings: potentialSavings,
          status: 'identified',
          recommendation: `Your ${contract.vendor_name} agreement is ${Math.round((actual / target - 1) * 100)}% above industry average for "${category}". Consider renegotiation or vendor consolidation.`
        }, { onConflict: 'contract_id' });

        console.log(`[CostOptimizer] Identified $${potentialSavings} savings for contract ${contract.id}`);
      }
    } catch (err) {
      console.error('[CostOptimizer] Error:', err.message);
    }
  }

  static mapSectorToBenchmark(sector) {
    if (!sector) return 'monitoring';
    const s = sector.toLowerCase();
    if (s.includes('firewall') || s.includes('network')) return 'firewall';
    if (s.includes('edr') || s.includes('endpoint') || s.includes('antivirus')) return 'edr';
    if (s.includes('cloud') || s.includes('aws') || s.includes('azure')) return 'cloud_security';
    if (s.includes('siem') || s.includes('log') || s.includes('soc')) return 'siem';
    if (s.includes('vuln') || s.includes('scan')) return 'vulnerability_management';
    if (s.includes('saas') || s.includes('software')) return 'saas_subscription';
    if (s.includes('telecom') || s.includes('isp')) return 'telco_link';
    if (s.includes('fintech') || s.includes('payment')) return 'payment_gateway';
    return 'monitoring';
  }

  /**
   * Recalculate all opportunities for a user
   */
  static async optimizeAll(userId) {
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('user_id', userId);

    if (contracts) {
      for (const contract of contracts) {
        await this.optimizeContract(contract.id, userId);
      }
    }
  }
}
