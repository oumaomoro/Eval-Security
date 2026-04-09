/**
 * Phase 18: Direct SQL Execution via Supabase Management API
 * Uses the Edge Functions / Admin endpoint that accepts raw PostgreSQL via REST.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Individual CREATE TABLE statements as an array for safe execution
const MIGRATIONS = [
  // pricing_tiers
  `CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    included_tokens INTEGER NOT NULL DEFAULT 0,
    overage_price_per_1k_tokens NUMERIC(8,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // clause_library
  `CREATE TABLE IF NOT EXISTS public.clause_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clause_name TEXT NOT NULL,
    clause_category TEXT NOT NULL,
    standard_language TEXT NOT NULL,
    jurisdiction TEXT DEFAULT 'universal',
    applicable_standards TEXT[] DEFAULT '{}',
    risk_level_if_missing TEXT DEFAULT 'medium',
    is_mandatory BOOLEAN DEFAULT false,
    generated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // marketplace_items
  `CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    content TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    sales_count INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // marketplace_sales
  `CREATE TABLE IF NOT EXISTS public.marketplace_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID,
    seller_id UUID,
    buyer_id UUID,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    commission NUMERIC(10,2) NOT NULL DEFAULT 0,
    net_to_seller NUMERIC(10,2) NOT NULL DEFAULT 0,
    paypal_payout_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // invoices
  `CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    description TEXT,
    pdf_url TEXT,
    paypal_invoice_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // background_jobs
  `CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    payload JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,

  // usage_logs
  `CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID,
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    operation TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // contract_overages
  `CREATE TABLE IF NOT EXISTS public.contract_overages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID,
    overage_month DATE NOT NULL,
    price_per_contract NUMERIC(8,2) DEFAULT 10,
    billed BOOLEAN DEFAULT false,
    billed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // alerts
  `CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // email_queue
  `CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "to" TEXT NOT NULL,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    next_attempt TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,

  // onboarding_emails_sent
  `CREATE TABLE IF NOT EXISTS public.onboarding_emails_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    milestone TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT onboarding_emails_sent_unique UNIQUE(user_id, milestone)
  )`,

  // Add columns to profiles
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paypal_email TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_provider TEXT DEFAULT 'paypal'`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false`,

  // Add org columns to existing tables
  `ALTER TABLE public.risk_register ADD COLUMN IF NOT EXISTS organization_id UUID`,
  `ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS organization_id UUID`,

  // Increment sales count function
  `CREATE OR REPLACE FUNCTION public.increment_sales_count(item_uid UUID)
   RETURNS VOID LANGUAGE plpgsql AS $$
   BEGIN
     UPDATE public.marketplace_items
     SET sales_count = COALESCE(sales_count, 0) + 1
     WHERE id = item_uid;
   END;
   $$`,

  // Enable RLS
  `ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.clause_library ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.marketplace_sales ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.contract_overages ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.onboarding_emails_sent ENABLE ROW LEVEL SECURITY`,

  // RLS Policies
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pricing_tiers' AND policyname='Public read pricing_tiers') THEN
      CREATE POLICY "Public read pricing_tiers" ON public.pricing_tiers FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='clause_library' AND policyname='Public read clause_library') THEN
      CREATE POLICY "Public read clause_library" ON public.clause_library FOR SELECT USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketplace_items' AND policyname='Public read marketplace_items') THEN
      CREATE POLICY "Public read marketplace_items" ON public.marketplace_items FOR SELECT USING (status = 'active');
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invoices' AND policyname='Users see own invoices') THEN
      CREATE POLICY "Users see own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='background_jobs' AND policyname='Users see own jobs') THEN
      CREATE POLICY "Users see own jobs" ON public.background_jobs FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$`
];

async function execSQL(sql, label) {
  // Try Supabase Management API database query endpoint
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );
  return { ok: res.ok, status: res.status, body: await res.text() };
}

async function main() {
  console.log(`🚀 Phase 18: Executing ${MIGRATIONS.length} migration statements against ${PROJECT_REF}...\n`);

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < MIGRATIONS.length; i++) {
    const stmt = MIGRATIONS[i].trim();
    const label = stmt.split('\n')[0].substring(0, 60);
    
    const { ok, status, body } = await execSQL(stmt, label);
    if (ok || body.includes('already exists') || body.includes('column already exists')) {
      process.stdout.write(`  ✅ [${i + 1}/${MIGRATIONS.length}] ${label}...\n`);
      passed++;
    } else {
      process.stdout.write(`  ⚠️  [${i + 1}/${MIGRATIONS.length}] ${label} → HTTP ${status}\n`);
      // Non-critical errors (already exists, etc) are acceptable
      if (!body.includes('42P07') && !body.includes('42701') && !body.includes('duplicate')) {
        errors.push({ label, body: body.substring(0, 200) });
        failed++;
      } else {
        passed++;
      }
    }
  }

  console.log(`\n📊 Result: ${passed} succeeded, ${failed} failed.\n`);

  if (errors.length > 0) {
    console.log('❌ Errors that need attention:');
    errors.forEach(e => console.log(`  - ${e.label}: ${e.body}`));
    console.log('\n💡 Open Supabase SQL Editor and paste migration file manually:');
    console.log(`   https://app.supabase.com/project/${PROJECT_REF}/sql/new\n`);
  } else {
    console.log('🎉 All migrations applied successfully! Database is production-ready.\n');
    
    // Seed pricing tiers
    console.log('🌱 Seeding pricing tiers...');
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await sb.from('pricing_tiers').upsert([
      { name: 'Starter', slug: 'starter', monthly_price: 149, included_tokens: 100000, overage_price_per_1k_tokens: 0.10 },
      { name: 'Professional', slug: 'pro', monthly_price: 399, included_tokens: 500000, overage_price_per_1k_tokens: 0.05 },
      { name: 'Enterprise', slug: 'enterprise', monthly_price: 999, included_tokens: 2000000, overage_price_per_1k_tokens: 0.02 }
    ], { onConflict: 'slug' });
    if (error) console.error('  ⚠️ Seed error:', error.message);
    else console.log('  ✅ Pricing tiers seeded.\n');
  }
}

main().catch(console.error);
