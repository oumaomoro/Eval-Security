# CyberOptimize One-Click Frontend Deployment
# To run: .\deploy_frontend.ps1
Write-Host "Launching CyberOptimize Cloudflare Deployment..." -ForegroundColor Cyan

# Cloudflare API Token
$env:CLOUDFLARE_API_TOKEN = "cfat_9k7BS1r3zyEPoibkc8aOSBrN8hm35cyHIMPk9SUj4f9439f5"

# 1. Build if needed
if (!(Test-Path "dist\public")) {
    Write-Host "Building frontend first..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed. Cannot deploy." -ForegroundColor Red
        exit 1
    }
}

# 2. Deploy to Cloudflare Pages
Write-Host "Pushing to Cloudflare Pages (costloci-frontend)..." -ForegroundColor Yellow
npx wrangler pages deploy dist\public --project-name=costloci-frontend --branch=main --commit-dirty=true

if ($LASTEXITCODE -eq 0) {
    Write-Host "MISSION COMPLETE: Frontend is Live at https://costloci-frontend.pages.dev" -ForegroundColor Green
} else {
    Write-Host "Deployment failed. Check Cloudflare credentials." -ForegroundColor Red
    exit 1
}

