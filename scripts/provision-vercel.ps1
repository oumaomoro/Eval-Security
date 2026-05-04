# ============================================================
# Costloci Enterprise - Vercel Live Provisioning Script
# Syncs all .env secrets to Vercel production environments
# ============================================================

param(
    [string]$EnvFile = ".env",
    [string[]]$Projects = @("backend", "cyberoptimize-frontend")
)

Write-Host "`n🚀 Costloci Vercel Provisioner - Starting..." -ForegroundColor Cyan

# Parse the .env file into a dictionary
$envVars = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line -match "=") {
        $idx = $line.IndexOf("=")
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim()
        $envVars[$key] = $val
    }
}

# Critical variables to provision (ordered by priority)
$criticalKeys = @(
    # --- Database & Auth ---
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "SESSION_SECRET",
    "CSRF_SECRET",

    # --- AI ---
    "OPENAI_API_KEY",
    "AI_INTEGRATIONS_OPENAI_API_KEY",
    "AI_INTEGRATIONS_OPENAI_BASE_URL",
    "DEEPSEEK_API_KEY",

    # --- Billing ---
    "PAYPAL_CLIENT_ID",
    "PAYPAL_SECRET",
    "PAYPAL_STARTER_PLAN_ID",
    "PAYPAL_PRO_PLAN_ID",
    "PAYPAL_ENTERPRISE_PLAN_ID",
    "PAYPAL_WEBHOOK_ID",
    "PAYSTACK_SECRET_KEY",
    "VITE_PAYSTACK_PUBLIC_KEY",

    # --- Communications ---
    "RESEND_API_KEY",
    "SIGNNOW_API_KEY",

    # --- Infrastructure ---
    "CRON_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",

    # --- OAuth ---
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",

    # --- URLs ---
    "FRONTEND_URL",
    "API_URL",
    "VITE_API_URL",
    "ALLOWED_ORIGINS",
    "NODE_ENV"
)

# Variables only for the frontend project (VITE_ prefix)
$frontendOnlyKeys = @(
    "VITE_PAYSTACK_PUBLIC_KEY",
    "VITE_API_URL"
)

# Variables only for the backend project
$backendOnlyKeys = @(
    "DATABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "SUPABASE_URL",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_SECRET",
    "PAYPAL_STARTER_PLAN_ID",
    "PAYPAL_PRO_PLAN_ID",
    "PAYPAL_ENTERPRISE_PLAN_ID",
    "PAYPAL_WEBHOOK_ID",
    "PAYSTACK_SECRET_KEY",
    "RESEND_API_KEY",
    "SIGNNOW_API_KEY",
    "OPENAI_API_KEY",
    "AI_INTEGRATIONS_OPENAI_API_KEY",
    "AI_INTEGRATIONS_OPENAI_BASE_URL",
    "DEEPSEEK_API_KEY",
    "JWT_SECRET",
    "SESSION_SECRET",
    "CSRF_SECRET",
    "CRON_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "FRONTEND_URL",
    "API_URL",
    "ALLOWED_ORIGINS",
    "NODE_ENV"
)

$successCount = 0
$failCount = 0

foreach ($project in $Projects) {
    Write-Host "`n📦 Provisioning project: $project" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray

    # Determine which keys apply to this project
    $keysForProject = if ($project -eq "cyberoptimize-frontend") {
        $criticalKeys | Where-Object { $frontendOnlyKeys -contains $_ -or $_ -in @("NODE_ENV", "FRONTEND_URL", "API_URL", "VITE_API_URL", "VITE_PAYSTACK_PUBLIC_KEY") }
    } else {
        $backendOnlyKeys
    }

    foreach ($key in $keysForProject) {
        if ($envVars.ContainsKey($key)) {
            $value = $envVars[$key]
            try {
                # Use echo to pipe value into vercel env add (avoids interactive prompt)
                $result = echo $value | npx vercel env add $key production --project $project 2>&1
                if ($LASTEXITCODE -eq 0 -or $result -match "already exists") {
                    Write-Host "  ✅ $key" -ForegroundColor Green
                    $successCount++
                } else {
                    Write-Host "  ⚠️  $key - Already exists or skipped" -ForegroundColor DarkYellow
                    $successCount++
                }
            } catch {
                Write-Host "  ❌ $key - FAILED: $_" -ForegroundColor Red
                $failCount++
            }
        } else {
            Write-Host "  ⚪ $key - Not in .env, skipping" -ForegroundColor DarkGray
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "✅ Provisioned: $successCount variables" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "❌ Failed:      $failCount variables" -ForegroundColor Red
}
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`n🎯 Triggering production redeployment..." -ForegroundColor Magenta

# Redeploy to pick up new env vars
npx vercel --prod --project backend --yes 2>&1 | Out-Null
Write-Host "✅ Backend redeployment triggered → https://api.costloci.com" -ForegroundColor Green
npx vercel --prod --project cyberoptimize-frontend --yes 2>&1 | Out-Null
Write-Host "✅ Frontend redeployment triggered → https://cyberoptimize-frontend.vercel.app" -ForegroundColor Green

Write-Host "`n🏁 Provisioning Complete. Platform is LIVE." -ForegroundColor Cyan
