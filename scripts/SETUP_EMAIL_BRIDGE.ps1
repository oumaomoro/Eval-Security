# ==============================================================
# COSTLOCI — Automated Email Bridge Setup
# This script configures Resend Inbound via API.
# ==============================================================

# 1. Prompt for API Key
$RESEND_API_KEY = Read-Host "🔑 Enter your Resend API Key (re_...)"
if (-not $RESEND_API_KEY.StartsWith("re_")) {
    Write-Host "❌ Invalid API Key format." -ForegroundColor Red
    exit 1
}

$WEBHOOK_URL = "https://api.costloci.com/api/integrations/email/webhook"

Write-Host "`n🚀 Initializing Automated Email Bridge Setup..." -ForegroundColor Cyan

# 2. Register Webhook
Write-Host "📡 Registering Webhook at Resend..." -ForegroundColor White

$body = @{
    url = $WEBHOOK_URL
    events = @("email.received")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.resend.com/webhooks" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $RESEND_API_KEY"; "Content-Type" = "application/json" } `
        -Body $body

    Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║       EMAIL BRIDGE SETUP SUCCESSFUL          ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host "🆔 Webhook ID: $($response.id)" -ForegroundColor White
    Write-Host "🔐 Signing Secret: (Check your Resend Dashboard)" -ForegroundColor Yellow
    Write-Host "🌐 Endpoint: $WEBHOOK_URL" -ForegroundColor White
    Write-Host "📧 Inbound Domain: (Ensure MX records point to Resend)" -ForegroundColor Cyan
    Write-Host "`n"
}
catch {
    Write-Host "❌ Failed to register webhook: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
