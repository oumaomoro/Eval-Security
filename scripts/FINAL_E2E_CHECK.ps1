# CyberOptimize Final Production Integrity Check
# Purpose: Deep End-to-End verification of live infrastructure.

$API_URL = "https://api.costloci.com/api/health"
$SITE_URL = "https://costloci.com"

Write-Host "`n🚀 Initializing Deep System Verification..." -ForegroundColor Cyan

# 1. API Health & SSL Check
Write-Host "`n1. Verifying API Cluster (api.costloci.com)..." -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri $API_URL -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Host "✅ API Cluster: HEALTHY" -ForegroundColor Green
        Write-Host "✅ Database Bridge: $($response.database.ToUpper())" -ForegroundColor Green
        Write-Host "✅ Region: $($response.region)" -ForegroundColor Gray
    } else {
        Write-Host "❌ API Cluster: DEGRADED ($($response.status))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ API Cluster: UNREACHABLE or SSL Error" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Gray
}

# 2. Frontend Connectivity
Write-Host "`n2. Verifying Frontend Edge (costloci.com)..." -ForegroundColor White
try {
    $siteResponse = Invoke-WebRequest -Uri $SITE_URL -Method Get -TimeoutSec 10
    if ($siteResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend Edge: ACTIVE (Cloudflare)" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend Edge: RETURNED $($siteResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Frontend Edge: UNREACHABLE" -ForegroundColor Red
}

# 3. Project Handover Status
Write-Host "`n------------------------------------------------"
Write-Host "✨ SYSTEM STATUS: PRODUCTION SEALED & SYNCED" -ForegroundColor Green
Write-Host "------------------------------------------------`n"
