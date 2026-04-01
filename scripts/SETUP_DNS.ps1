# ==============================================================
# Costloci - Cloudflare DNS Auto-Configurator
# Run: $env:CLOUDFLARE_API_TOKEN="your_token"; .\scripts\SETUP_DNS.ps1
# Get token: https://dash.cloudflare.com/profile/api-tokens
# Required permission: Zone - DNS - Edit
# ==============================================================

param([string]$CF_TOKEN = $env:CLOUDFLARE_API_TOKEN)

$ZONE_ID     = "745455d71d503d23c1c16003b1bf099b"
$ACCOUNT_ID  = "8dc05e6cc0ee7377c2f17f4ff69baec9"
$PAGES_PROJ  = "costloci-frontend"
$PAGES_URL   = "costloci-frontend.pages.dev"
$VERCEL_CNAME = "cname.vercel-dns.com"

if (-not $CF_TOKEN) {
    Write-Host ""
    Write-Host "ERROR: No Cloudflare API Token found." -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Go to: https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Yellow
    Write-Host "2. Click 'Create Token' -> Use 'Edit zone DNS' template" -ForegroundColor Yellow
    Write-Host "3. Scope: Zone = costloci.com" -ForegroundColor Yellow
    Write-Host "4. Run: " -ForegroundColor Yellow -NoNewline
    Write-Host '   $env:CLOUDFLARE_API_TOKEN="your_token"; .\scripts\SETUP_DNS.ps1' -ForegroundColor Cyan
    exit 1
}

$headers = @{ "Authorization" = "Bearer $CF_TOKEN"; "Content-Type" = "application/json" }

function Write-OK  { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Warn{ param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow }

Write-Host ""
Write-Host "Configuring Cloudflare DNS for costloci.com..." -ForegroundColor Cyan
Write-Host ""

# --- Helper: Upsert DNS Record ---
function Set-DnsRecord {
    param($Type, $Name, $Content, [bool]$Proxied = $true)

    # Check if record exists
    $existing = Invoke-RestMethod -Method Get `
        -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$Name&type=$Type" `
        -Headers $headers

    $body = @{ type = $Type; name = $Name; content = $Content; ttl = 1; proxied = $Proxied } | ConvertTo-Json

    if ($existing.result.Count -gt 0) {
        # Update existing record
        $id = $existing.result[0].id
        $r = Invoke-RestMethod -Method Put `
            -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$id" `
            -Headers $headers -Body $body
        if ($r.success) { Write-OK "Updated: $Name -> $Content $(if($Proxied){'[Proxied]'})" }
        else             { Write-Warn "Failed to update $Name : $($r.errors.message)" }
    } else {
        # Create new record
        $r = Invoke-RestMethod -Method Post `
            -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
            -Headers $headers -Body $body
        if ($r.success) { Write-OK "Created: $Name -> $Content $(if($Proxied){'[Proxied]'})" }
        else             { Write-Warn "Failed to create $Name : $($r.errors.message)" }
    }
}

# 1. Frontend: costloci.com -> Cloudflare Pages (proxied = full CDN + free SSL)
Set-DnsRecord -Type "CNAME" -Name "costloci.com"     -Content $PAGES_URL -Proxied $true
Set-DnsRecord -Type "CNAME" -Name "www.costloci.com" -Content $PAGES_URL -Proxied $true

# 2. Backend: api.costloci.com -> Vercel (NOT proxied = needed for Vercel SSL cert)
Set-DnsRecord -Type "CNAME" -Name "api.costloci.com" -Content $VERCEL_CNAME -Proxied $false

# 3. Link costloci.com & www.costloci.com to Pages project via API
Write-Host ""
Write-Host "Linking custom domains to Cloudflare Pages project..." -ForegroundColor Cyan
$domains = "costloci.com", "www.costloci.com"
foreach ($domain in $domains) {
    $body = @{ name = $domain } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Method Post `
            -Uri "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJ/domains" `
            -Headers $headers -Body $body
        if ($r.success) { Write-OK "Pages: Linked $domain" }
        else             { Write-Warn "Pages: $domain - $($r.errors.message)" }
    } catch {
        Write-Warn "Pages: $domain may already be linked."
    }
}

# 4. Final DNS verification
Write-Host ""
Write-Host "Verifying DNS resolution..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
$hostsToVerify = "costloci.com", "www.costloci.com", "api.costloci.com"
foreach ($htv in $hostsToVerify) {
    try {
        $result = Resolve-DnsName $htv -ErrorAction Stop
        $resVal = if ($result[0].NameHost) { $result[0].NameHost } else { $result[0].IPAddress }
        Write-OK "$htv resolves to: $resVal"
    } catch {
        Write-Warn "$htv not yet resolving (propagation takes 1-5 min)"
    }
}

Write-Host ""
Write-Host "-------------------------------------------------------" -ForegroundColor Green
Write-Host "           DNS CONFIGURATION COMPLETE                  " -ForegroundColor Green
Write-Host "-------------------------------------------------------" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: https://costloci.com     - Cloudflare Pages" -ForegroundColor White
Write-Host "  Backend:  https://api.costloci.com - Vercel API" -ForegroundColor White
Write-Host ""
Write-Host "  Allow 5-15 minutes for global DNS propagation." -ForegroundColor Yellow
Write-Host ""
