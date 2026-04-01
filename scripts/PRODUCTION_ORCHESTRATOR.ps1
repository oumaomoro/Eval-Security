# ==============================================================
# COSTLOCI — Golden Deployment Orchestrator
# Use this for all future zero-downtime production updates.
# ==============================================================

$CF_PROJECT = "costloci-frontend"

Write-Host "`n🚀 Initializing Automated Production Deployment..." -ForegroundColor Cyan

# 1. Pre-flight Checks
Write-Host "🔍 Running Pre-flight..." -ForegroundColor White
if (-not (Test-Path ".git")) { 
    Write-Host "⚠️ Warning: Not in root directory. Attempting to locate root..." -ForegroundColor Yellow
}

# 2. Production Build
Write-Host "📦 Building Frontend (Transpiling assets)..." -ForegroundColor White
Set-Location "frontend"
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Build failed. Aborting deployment." -ForegroundColor Red
    exit 1 
}

# 3. Direct Upload to Cloudflare Pages (Production Environment)
Write-Host "☁️ Deploying to Cloudflare (Branch: main)..." -ForegroundColor White
# We run this from the frontend folder to ensure wrangler.toml is picked up
npx wrangler pages deploy dist --project-name=$CF_PROJECT --branch=main --commit-dirty=true

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed. Check your Cloudflare login status." -ForegroundColor Red
    Write-Host "💡 Run: npx wrangler login" -ForegroundColor Yellow
    exit 1
}

# 4. Success Audit
Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       DEPLOYMENT SUCCESSFUL & SEALED         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host "🌐 Live Site: https://costloci.com" -ForegroundColor White
Write-Host "📊 API Health: https://api.costloci.com/api/health" -ForegroundColor White
Write-Host "`n"

Set-Location ..
