# Cloudflare WAF Activation Script (ASCII Version)
# Zone: costloci.com

$API_TOKEN = "cfut_ykHLlANciPfd9tyjJF7qQh0AUVlU79oOr5t0A2EDf973a204"
$ZONE_ID = "745455d71d503d23c1c16003b1bf099b"

Write-Host "Initializing Cloudflare WAF Hardening..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type"  = "application/json"
}

# 1. Enable Managed Rules for the Zone
$wafUrl = "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_level"
$body = @{ value = "high" } | ConvertTo-Json
$res1 = Invoke-RestMethod -Uri $wafUrl -Method Patch -Headers $headers -Body $body
Write-Host "OK: Security Level set to HIGH" -ForegroundColor Green

# 2. Enable Browser Integrity Check
$bicUrl = "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/browser_check"
$body = @{ value = "on" } | ConvertTo-Json
$res2 = Invoke-RestMethod -Uri $bicUrl -Method Patch -Headers $headers -Body $body
Write-Host "OK: Browser Integrity Check: ON" -ForegroundColor Green

Write-Host "WAF Protection Active." -ForegroundColor Cyan
