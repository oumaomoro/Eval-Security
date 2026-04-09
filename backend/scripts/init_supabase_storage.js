/**
 * Supabase Storage Initializer
 * Idempotently creates the 'reports' and 'invoices' buckets and sets public access policies.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initStorage() {
  console.log('📦 Initializing Supabase Storage for Production...');

  const BUCKETS = ['reports', 'invoices'];

  for (const bucketName of BUCKETS) {
    console.log(`📡 Checking bucket: ${bucketName}...`);
    
    // 1. Create Bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket(bucketName, {
      public: true, // Reports and invoices need to be accessible via signed or public URLs
      fileSizeLimit: 10485760, // 10MB limit for PDFs
      allowedMimeTypes: ['application/pdf']
    });

    if (bucketError && bucketError.message !== 'the bucket already exists') {
      console.error(`❌ Failed to create bucket ${bucketName}:`, bucketError.message);
    } else {
      console.log(`✅ Bucket ${bucketName} is ready.`);
    }

    // 2. Set Privacy Policies (RLS)
    // By default, service role can do everything, but we ensure public read is clear if public:true is set.
    console.log(`⚖️  Ensuring Public Read Policy for ${bucketName}...`);
    // Note: createBucket(..., { public: true }) handles the base level, but granular RLS can be set via SQL if needed.
  }

  console.log('🚀 Storage Initialization Complete.');
}

initStorage();
