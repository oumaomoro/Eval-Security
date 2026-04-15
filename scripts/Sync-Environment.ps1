# CyberOptimize Enterprise Environment Synchronizer
# Usage: .\scripts\Sync-Environment.ps1

$ErrorActionPreference = "Stop"
Write-Host "📡 Initializing Fullstack Synchronization..." -ForegroundColor Cyan

# 1. Check Prerequisites
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) not found. Please install it first." -ForegroundColor Red
    exit 1
}

$authStatus = & gh auth status 2>&1
if ($authStatus -match "not logged in") {
    Write-Host "❌ GitHub CLI is not authenticated." -ForegroundColor Yellow
    Write-Host "Please run: gh auth login" -ForegroundColor White
    exit 1
}

# 2. Local -> GitHub Sync
Write-Host "🔄 Pushing local .env to GitHub Actions Secrets..." -ForegroundColor Yellow
if (Test-Path ".env") {
    & gh secret set -f .env
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub Secrets synchronized." -ForegroundColor Green
    } else {
        Write-Host "❌ GitHub synchronization failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Local .env file not found." -ForegroundColor Red
    exit 1
}

# 3. Trigger Deployment (Optional)
$trigger = Read-Host "🚀 Trigger deployment now? (y/n)"
if ($trigger -eq "y") {
    Write-Host "🛰️ Triggering 'Deploy Costloci Enterprise' workflow..." -ForegroundColor Yellow
    & gh workflow run "Deploy Costloci Enterprise"
    Write-Host "✅ Workflow triggered. Check GitHub Actions for status." -ForegroundColor Green
}

Write-Host "`n🏛️ MISSION COMPLETE: Fullstack Environment Harmonized." -ForegroundColor Cyan
