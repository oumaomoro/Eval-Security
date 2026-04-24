# ╔══════════════════════════════════════════════════════════════════╗
# ║  COSTLOCI ENTERPRISE — MASTER DEPLOY PIPELINE                   ║
# ║  Usage: .\deploy_all.ps1                                        ║
# ║  Steps: TypeCheck → DB Sync → E2E Tests → Build → Deploy        ║
# ╚══════════════════════════════════════════════════════════════════╝

param(
  [switch]$SkipTests,
  [switch]$SkipBuild,
  [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Step($msg) {
  Write-Host "`n╠══ $msg" -ForegroundColor Cyan
}
function Ok($msg) {
  Write-Host "  ✅ $msg" -ForegroundColor Green
}
function Fail($msg) {
  Write-Host "  ❌ FAILED: $msg" -ForegroundColor Red
  exit 1
}

Write-Host "`n************************************************************" -ForegroundColor Magenta
Write-Host "*   COSTLOCI ENTERPRISE DEPLOY PIPELINE                    *" -ForegroundColor Magenta
Write-Host "************************************************************`n" -ForegroundColor Magenta

# ── Step 1: TypeScript Check ─────────────────────────────────────────────────
Step "STEP 1: TypeScript Certification"
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host $tscResult
  Fail "TypeScript errors found. Fix before deploying."
}
Ok "TypeScript: 0 errors"

# ── Step 2: DB Sync Verification ─────────────────────────────────────────────
Step "STEP 2: Database Schema Verification"
npx tsx scripts/verify_db_sync.ts
if ($LASTEXITCODE -ne 0) {
  Fail "DB schema out of sync. Run phase26_harmonize.sql in Supabase SQL Editor."
}
Ok "Database: All tables confirmed"

# ── Step 3: E2E Test Suite ────────────────────────────────────────────────────
if (-not $SkipTests) {
  Step "STEP 3: End-to-End Test Suite"
  Write-Host "  Checking if dev server is running on port 3200..." -ForegroundColor Yellow
  
  $serverCheck = $null
  try { $serverCheck = Invoke-RestMethod -Uri "http://127.0.0.1:3200/api/health" -TimeoutSec 5 } catch {}
  
  if (-not $serverCheck) {
    Write-Host "  ⚠️  Dev server not detected. Starting it in background..." -ForegroundColor Yellow
    $serverJob = Start-Job -ScriptBlock { 
      Set-Location $using:PSScriptRoot
      npx cross-env NODE_ENV=development tsx server/index.ts 
    }
    Start-Sleep -Seconds 15
    Write-Host "  Server started (Job ID: $($serverJob.Id))" -ForegroundColor Yellow
  }
  
  npx tsx scripts/e2e_full_suite.ts
  if ($LASTEXITCODE -ne 0) {
    Fail "E2E tests failed. Deployment aborted."
  }
  Ok "All E2E tests passing"
} else {
  Write-Host "  ⏭️  E2E tests skipped (--SkipTests)" -ForegroundColor Yellow
}

# ── Step 4: Production Build ──────────────────────────────────────────────────
if (-not $SkipBuild) {
  Step "STEP 4: Production Build"
  npx tsx script/build.ts
  if ($LASTEXITCODE -ne 0) {
    Fail "Build failed."
  }
  Ok "Build complete → dist/"
} else {
  Write-Host "  ⏭️  Build skipped (--SkipBuild)" -ForegroundColor Yellow
}

# ── Step 5: Deploy Frontend ───────────────────────────────────────────────────
Step "STEP 5: Deploy Frontend to Cloudflare Pages"
if (-not (Test-Path "dist\public")) {
  Fail "dist\public not found. Run without --SkipBuild first."
}

npx wrangler pages deploy dist\public --project-name=costloci-frontend --branch=main --commit-dirty=true
if ($LASTEXITCODE -ne 0) {
  Fail "Cloudflare deployment failed."
}
Ok "Frontend deployed → https://costloci-frontend.pages.dev"

# ── Step 6: Trigger Backend Deployment (Git Push) ─────────────────────────────
Step "STEP 6: Synchronizing Repository & Triggering Backend (Vercel)"
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "chore: automated production sync - $(Get-Date -Format 'yyyy-MM-dd HH:mm')" --no-verify
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Fail "Git push failed. Ensure your remote is configured correctly."
    }
    Ok "Repository synchronized. Vercel backend build triggered."
} else {
    Ok "No changes to synchronize."
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "`n************************************************************" -ForegroundColor Green
Write-Host "*   ✅ DEPLOYMENT COMPLETE                                  *" -ForegroundColor Green
Write-Host "*                                                          *" -ForegroundColor Green
Write-Host "*   Frontend: https://costloci-frontend.pages.dev          *" -ForegroundColor Green
Write-Host "*                                                          *" -ForegroundColor Green
Write-Host "*   Backend (manual): Push server/ to Railway/Render       *" -ForegroundColor Green
Write-Host "*   Or run: npm start (uses dist/index.cjs)                *" -ForegroundColor Green
Write-Host "************************************************************`n" -ForegroundColor Green
