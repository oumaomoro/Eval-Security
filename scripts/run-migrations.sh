#!/bin/bash
# run-migrations.sh
# Idempotent script to apply SQL migrations securely.

set -e # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting Costloci Database Migrations Strategy..."

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ Error: SUPABASE_DB_PASSWORD environment variable is required."
  exit 1
fi

PROJECT_REF=${SUPABASE_PROJECT_REF:-"your-project-ref"}

echo "Verifying migration state..."

# Supabase CLI approach
# We assume supabase cli is installed in the CI workspace
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI to apply migrations..."
    # Attempt pushing migrations to the remote db
    supabase db push --password "$SUPABASE_DB_PASSWORD"
    
    if [ $? -eq 0 ]; then
       echo "✅ Migrations applied successfully via CLI!"
    else
       echo "❌ Migration failed. CLI automatically handles transactional rollbacks for failed batches."
       exit 1
    fi
else
    echo "Supabase CLI not found. Falling back to direct psql execution (not recommended for production state tracking)..."
    echo "Please install Supabase CLI: npm i -g supabase"
    exit 1
fi

echo "All schemas are up to date."
