/**
 * Phase 15: Database Seeding Script
 * Populates the 'pricing_tiers' table with accurate enterprise monetization metadata.
 */
import { supabase } from '../services/supabase.service.js';

async function seedPricingTiers() {
  console.log('🌱 Seeding Enterprise Pricing Tiers...');

  const tiers = [
    {
      name: 'Starter',
      slug: 'starter',
      included_tokens: 100000,
      overage_price_per_1k_tokens: 0.10, // $0.10 per 1k tokens overage
      monthly_price: 149
    },
    {
      name: 'Professional',
      slug: 'pro',
      included_tokens: 500000,
      overage_price_per_1k_tokens: 0.05, // $0.05 per 1k tokens overage
      monthly_price: 399
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      included_tokens: 2000000, // 2M tokens included
      overage_price_per_1k_tokens: 0.02, // $0.02 per 1k tokens overage
      monthly_price: 999
    }
  ];

  const { error } = await supabase.from('pricing_tiers').upsert(tiers, { onConflict: 'slug' });

  if (error) {
    console.error('❌ Seeding failed:', error.message);
  } else {
    console.log('✅ Pricing tiers seeded successfully.');
  }
}

seedPricingTiers();
