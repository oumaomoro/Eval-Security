# CyberOptimize One-Click Frontend Deployment
# To run this: .\deploy_frontend.ps1
Write-Host "🚀 Launching CyberOptimize Cloudflare Deployment..." -ForegroundColor Cyan

# 1. Ensure we are in the root
if (!(Test-Path "dist\public")) {
    Write-Host "[X] Error: dist\public not found. Please run 'npm run build' first." -ForegroundColor Red
    exit
}

# 2. Trigger Wrangler
Write-Host "📡 Pushing artifacts to Cloudflare Pages (Project: costloci-frontend)..." -ForegroundColor Yellow
npx wrangler pages deploy dist\public --project-name=costloci-frontend --branch=main --commit-dirty=true

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MISSION COMPLETE: Frontend is Live!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed. Check your Cloudflare credentials or API status." -ForegroundColor Red
}
