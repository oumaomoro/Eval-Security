#!/bin/bash
# verify-env-vars.sh
# Pipeline script to halt deployment if critical SaaS variables are missing.

set -e

echo "🔒 Verifying Required Production Environment Variables..."

REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "OPENAI_API_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_PRICE_STARTER_MONTH"
  "STRIPE_PRICE_STARTER_YEAR"
  "STRIPE_PRICE_PRO_MONTH"
  "STRIPE_PRICE_PRO_YEAR"
  "STRIPE_PRICE_API_MONTH"
  "STRIPE_PRICE_API_YEAR"
  "CRON_SECRET"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
)

MISSING_COUNT=0

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ CRITICAL FAULT: Missing Environment Variable '$var'."
    MISSING_COUNT=$((MISSING_COUNT + 1))
  else
    echo "✅ $var is correctly set."
  fi
done

if [ "$MISSING_COUNT" -gt 0 ]; then
  echo "🚨 $MISSING_COUNT critical environment variables are absent. Halting deployment pipeline immediately."
  exit 1
fi

echo "All verification checks passed. Environment is fully production-ready."
exit 0
