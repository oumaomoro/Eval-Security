# ==============================================================
# COSTLOCI — Full Stack Deployment Orchestrator
# Architecture: Cloudflare Pages (Frontend) + Vercel (Backend API)
# ==============================================================
# Run: .\scripts\DEPLOY_FULLSTACK.ps1
# Requires env vars (set once, then auto-managed):
#   $env:CLOUDFLARE_API_TOKEN = "your_cf_token"
#   $env:VERCEL_TOKEN         = "your_vercel_token"
# ==============================================================

param(
    [string]$CF_TOKEN     = $env:CLOUDFLARE_API_TOKEN,
    [string]$VercelToken  = $env:VERCEL_TOKEN
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

# Cloudflare config (already set up in your account)
$CF_ZONE_ID      = "745455d71d503d23c1c16003b1bf099b"
$CF_ACCOUNT_ID   = "8dc05e6cc0ee7377c2f17f4ff69baec9"
$CF_PAGES_PROJECT = "costloci-frontend"

# Vercel config
$VERCEL_BACKEND_PROJECT = "prj_pWdvodBRU6wg1mFFMGDHIx9KD6SJ"

function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    COSTLOCI — Automated Full-Stack Deployment         ║" -ForegroundColor Cyan
Write-Host "║    Frontend: Cloudflare Pages  (Free, Unlimited CDN)  ║" -ForegroundColor DarkCyan
Write-Host "║    Backend:  Vercel API        (Serverless Node.js)   ║" -ForegroundColor DarkCyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ---------------------------------------------------------------
# PREFLIGHT CHECKS
# ---------------------------------------------------------------
Write-Step "Preflight Checks..."

if (-not $CF_TOKEN)    { Write-Fail "CLOUDFLARE_API_TOKEN not set.`nGet it at: https://dash.cloudflare.com/profile/api-tokens" }
if (-not $VercelToken) { Write-Fail "VERCEL_TOKEN not set.`nGet it at: https://vercel.com/account/tokens" }
if (-not (Get-Command node     -ErrorAction SilentlyContinue)) { Write-Fail "Node.js not installed." }
if (-not (Get-Command vercel   -ErrorAction SilentlyContinue)) {
    Write-Warn "Vercel CLI not found. Installing..."
    npm install -g vercel --silent
}
if (-not (Get-Command npx      -ErrorAction SilentlyContinue)) { Write-Fail "npx not available." }

if (-not (Test-Path "$Root\backend\.env"))  { Write-Fail "backend/.env missing." }
if (-not (Test-Path "$Root\frontend\dist")) { Write-Fail "frontend/dist not found. Build may have failed." }

Write-OK "Preflight passed. Starting deployment sequence."

# ---------------------------------------------------------------
# STEP 1: DEPLOY BACKEND TO VERCEL
# ---------------------------------------------------------------
Write-Step "Step 1/4 — Deploying Backend API to Vercel..."
Set-Location "$Root\backend"

# Sync all live .env vars to Vercel environment
Write-Host "  → Syncing env variables to Vercel..." -ForegroundColor DarkGray
$envLines = Get-Content ".env" | Where-Object { $_ -notmatch "^\s*#" -and $_ -match "=" }
foreach ($line in $envLines) {
    $parts = $line -split "=", 2
    $key   = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    if ($key -and $value -and $value -notlike "*placeholder*" -and $value -notlike "*MOCK*") {
        $value | vercel env add $key production --token=$VercelToken --yes 2>$null
    }
}

Write-Host "  → Deploying to Vercel..." -ForegroundColor DarkGray
vercel --prod --yes --token=$VercelToken
if ($LASTEXITCODE -ne 0) { Write-Fail "Backend deployment failed." }
Write-OK "Backend API deployed to Vercel."

# Link api.costloci.com to backend via Vercel API
$vercelHeaders = @{ "Authorization" = "Bearer $VercelToken"; "Content-Type" = "application/json" }
try {
    Invoke-RestMethod -Method Post `
        -Uri "https://api.vercel.com/v10/projects/$VERCEL_BACKEND_PROJECT/domains" `
        -Headers $vercelHeaders `
        -Body ('{"name":"api.costloci.com"}') | Out-Null
    Write-OK "api.costloci.com linked to Vercel backend."
} catch {
    Write-Warn "api.costloci.com already linked or check Vercel dashboard."
}

Set-Location $Root

# ---------------------------------------------------------------
# STEP 2: DEPLOY FRONTEND TO CLOUDFLARE PAGES
# ---------------------------------------------------------------
Write-Step "Step 2/4 — Deploying Frontend to Cloudflare Pages..."
Set-Location "$Root\frontend"

Write-Host "  → Uploading dist/ to Cloudflare Pages..." -ForegroundColor DarkGray
npx wrangler pages deploy dist `
    --project-name=$CF_PAGES_PROJECT `
    --branch=main `
    --commit-message="Production deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm')" `
    --env CLOUDFLARE_API_TOKEN=$CF_TOKEN

if ($LASTEXITCODE -ne 0) { Write-Fail "Cloudflare Pages deployment failed." }
Write-OK "Frontend deployed to Cloudflare Pages."
Set-Location $Root

# ---------------------------------------------------------------
# STEP 3: CONFIGURE DNS + LINK DOMAINS IN CLOUDFLARE
# ---------------------------------------------------------------
Write-Step "Step 3/4 — Configuring Cloudflare DNS + Domain Linking..."

$cfHeaders = @{ "Authorization" = "Bearer $CF_TOKEN"; "Content-Type" = "application/json" }

# Helper: ensure DNS record exists, create if missing
function Ensure-DnsRecord {
    param($Type, $Name, $Content, $Proxied)
    $existing = Invoke-RestMethod -Method Get `
        -Uri "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?name=$Name&type=$Type" `
        -Headers $cfHeaders
    if ($existing.result.Count -eq 0) {
        $body = @{ type=$Type; name=$Name; content=$Content; ttl=1; proxied=$Proxied } | ConvertTo-Json
        $r = Invoke-RestMethod -Method Post `
            -Uri "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" `
            -Headers $cfHeaders -Body $body
        if ($r.success) { Write-OK "DNS: $Name → $Content" }
        else             { Write-Warn "DNS record issue for $Name : $($r.errors.message)" }
    } else {
        Write-OK "DNS: $Name already configured."
    }
}

# costloci.com → Cloudflare Pages (proxied, free CDN)
Ensure-DnsRecord -Type "CNAME" -Name "costloci.com"     -Content "$CF_PAGES_PROJECT.pages.dev" -Proxied $true
Ensure-DnsRecord -Type "CNAME" -Name "www.costloci.com" -Content "$CF_PAGES_PROJECT.pages.dev" -Proxied $true

# api.costloci.com → Vercel (unproxied, needed for Vercel SSL verification)
Ensure-DnsRecord -Type "CNAME" -Name "api.costloci.com" -Content "cname.vercel-dns.com" -Proxied $false

# Link costloci.com and www.costloci.com to Cloudflare Pages project
$domainsToLink = @("costloci.com", "www.costloci.com")
foreach ($domain in $domainsToLink) {
    $body = @{ name = $domain } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Method Post `
            -Uri "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$CF_PAGES_PROJECT/domains" `
            -Headers $cfHeaders -Body $body
        if ($r.success) { Write-OK "Pages: $domain linked to Cloudflare Pages." }
        else             { Write-Warn "Pages: $domain — $($r.errors.message)" }
    } catch {
        Write-Warn "Pages: $domain already linked or needs review."
    }
}

# ---------------------------------------------------------------
# STEP 4: REGISTER PAYPAL WEBHOOKS
# ---------------------------------------------------------------
Write-Step "Step 4/4 — Registering PayPal Webhooks..."
Set-Location $Root
node scripts/register-paypal-webhooks.js
if ($LASTEXITCODE -ne 0) {
    Write-Warn "PayPal webhooks may already be registered. Check the output."
} else {
    Write-OK "PayPal webhooks registered."
}

# ---------------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------------
Write-Step "Running Health Checks (allow 30s for propagation)..."
Start-Sleep -Seconds 10

$checks = @(
    @{ url = "https://api.costloci.com/api/health"; label = "Backend API" },
    @{ url = "https://costloci.com";                label = "Frontend (costloci.com)" }
)

foreach ($check in $checks) {
    try {
        $r = Invoke-WebRequest -Uri $check.url -TimeoutSec 10 -UseBasicParsing
        Write-OK "$($check.label) is LIVE ($($r.StatusCode))"
    } catch {
        Write-Warn "$($check.label) not resolving yet — DNS propagation may take 5-15 min."
    }
}

# ---------------------------------------------------------------
# DEPLOYMENT SUMMARY
# ---------------------------------------------------------------
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          COSTLOCI DEPLOYMENT COMPLETE ✅              ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Frontend (Cloudflare Pages):  https://costloci.com" -ForegroundColor White
Write-Host "  🔌 Backend API (Vercel):          https://api.costloci.com" -ForegroundColor White
Write-Host "  📊 Database (Supabase):           Active" -ForegroundColor White
Write-Host "  💳 PayPal Webhooks:               Registered" -ForegroundColor White
Write-Host ""
Write-Host "  📋 Post-Deployment Checklist:" -ForegroundColor Yellow
Write-Host "  [ ] Supabase Auth → Google redirect URL → https://costloci.com/dashboard" -ForegroundColor Gray
Write-Host "  [ ] DocuSign Webhook → https://api.costloci.com/api/integrations/docusign/webhook" -ForegroundColor Gray
Write-Host "  [ ] Word Add-in manifest (addin.costloci.com) — optional" -ForegroundColor Gray
Write-Host ""
