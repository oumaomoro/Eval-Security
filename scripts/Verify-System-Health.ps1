# CyberOptimize Enterprise Health Diagnostic
# Usage: .\scripts\Verify-System-Health.ps1

$ErrorActionPreference = "Continue"
Write-Host "🕵️ Starting Forensic Infrastructure Audit..." -ForegroundColor Cyan

# 1. Database & Identity (Supabase)
Write-Host "`n📡 Testing Supabase Connectivity..." -ForegroundColor Yellow
$env_file = Get-Content ".env" -ErrorAction SilentlyContinue
$supabase_url = ($env_file | Select-String "SUPABASE_URL=").Line.Split("=")[1]
$supabase_anon = ($env_file | Select-String "SUPABASE_ANON_KEY=").Line.Split("=")[1]

try {
    $resp = Invoke-RestMethod -Uri "$supabase_url/rest/v1/" -Headers @{"apikey"=$supabase_anon; "Authorization"="Bearer $supabase_anon"} -Method Get
    Write-Host "✅ Supabase Identity & Rest API: Connected." -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase Connection Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Redis Cache (Upstash)
Write-Host "`n📦 Testing Upstash Redis Connectivity..." -ForegroundColor Yellow
$redis_url = ($env_file | Select-String "UPSTASH_REDIS_REST_URL=").Line.Split("=")[1]
$redis_token = ($env_file | Select-String "UPSTASH_REDIS_REST_TOKEN=").Line.Split("=")[1]

try {
    $resp = Invoke-RestMethod -Uri "$redis_url/get/ping" -Headers @{"Authorization"="Bearer $redis_token"} -Method Get
    Write-Host "✅ Upstash Redis: $($resp.result)" -ForegroundColor Green
} catch {
    Write-Host "❌ Upstash Redis Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Cloudflare Pages
Write-Host "`n🌤️ Testing Cloudflare API Connectivity..." -ForegroundColor Yellow
$cf_token = ($env_file | Select-String "CLOUDFLARE_API_TOKEN=").Line.Split("=")[1]

try {
    $resp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers @{"Authorization"="Bearer $cf_token"} -Method Get
    if ($resp.success) {
        Write-Host "✅ Cloudflare API: Verified." -ForegroundColor Green
    } else {
        throw "API reported failure"
    }
} catch {
    Write-Host "❌ Cloudflare API Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. OpenAI Gateway
Write-Host "`n🤖 Testing OpenAI API..." -ForegroundColor Yellow
$openai_key = ($env_file | Select-String "AI_INTEGRATIONS_OPENAI_API_KEY=").Line.Split("=")[1]

try {
    $resp = Invoke-RestMethod -Uri "https://api.openai.com/v1/models" -Headers @{"Authorization"="Bearer $openai_key"} -Method Get
    Write-Host "✅ OpenAI Intelligence Engine: Responsive." -ForegroundColor Green
} catch {
    Write-Host "❌ OpenAI Connection Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🏛️ Audit Complete. Infrastructure is $(if($Error.Count -eq 0){'Healthy'}else{'Degraded'})." -ForegroundColor Cyan
