# CyberOptimize Production Deployment Orchestrator
Write-Host "Initializing CyberOptimize Production Build..." -ForegroundColor Cyan

if (!(Test-Path "backend\.env")) { 
    Write-Host "[X] Backend .env missing!" -ForegroundColor Red
    exit 
}
if (!(Test-Path "frontend\.env")) {
    Write-Host "[X] Frontend .env missing!" -ForegroundColor Red
    exit
}

Write-Host "[*] Building Frontend Assets..." -ForegroundColor Yellow
cd frontend
npm install
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "[X] Frontend Build Failed!" -ForegroundColor Red; exit }
cd ..

Write-Host "[*] Deploying Backend to Vercel..." -ForegroundColor Magenta
cd backend
npm install
vercel --prod --yes
if ($LASTEXITCODE -ne 0) { Write-Host "[X] Vercel Deployment Failed!" -ForegroundColor Red; exit }
cd ..

Write-Host "[*] Deploying Frontend to Cloudflare Pages..." -ForegroundColor Teal
cd frontend
npx wrangler pages deploy dist --project-name=cyberoptimize --branch=main
if ($LASTEXITCODE -ne 0) { Write-Host "[X] Cloudflare Deployment Failed!" -ForegroundColor Red; exit }
cd ..

Write-Host "[SUCCESS] DEPLOYMENT SEQUENCE COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "Next: Update your PayPal/Stripe Webhooks in their dashboards." -ForegroundColor White
