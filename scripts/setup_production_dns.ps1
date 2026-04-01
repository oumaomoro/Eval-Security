# Costloci DNS and Domain Automation (costloci.com)
# Zone ID: 745455d71d503d23c1c16003b1bf099b

param(
    [string]$CF_API_TOKEN = $env:CLOUDFLARE_API_TOKEN
)

# New Zone ID provided by USER
$ZONE_ID = "745455d71d503d23c1c16003b1bf099b"
$BACKEND_SUBDOMAIN = "api"
$WWW_SUBDOMAIN = "www"
$VERCEL_CNAME = "cname.vercel-dns.com"
$PAGES_TARGET = "costloci-frontend.pages.dev"
$PAGES_PROJECT = "costloci-frontend"
$ACCOUNT_ID = "8dc05e6cc0ee7377c2f17f4ff69baec9" # Verified from API token Profile

if (-not $CF_API_TOKEN) {
    Write-Host "CLOUDFLARE_API_TOKEN not found in environment." -ForegroundColor Yellow
    $CF_API_TOKEN = Read-Host "Please enter your Cloudflare API Token (Edit Zone DNS permissions)"
}

Write-Host "Automating DNS for costloci.com..." -ForegroundColor Cyan

# 1. Clean up potential conflicts (Resolving 'CNAME Cross-User Banned')
Write-Host "Checking for existing records for costloci.com..."
$records = Invoke-RestMethod -Method Get `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
    -Headers @{ "Authorization" = "Bearer $CF_API_TOKEN"; "Content-Type" = "application/json" }

# If an apex CNAME or A record exists that we didn't create, it might be the cause of the 'Banned' error.
$conflict = $records.result | Where-Object { $_.name -eq "costloci.com" -and $_.type -eq "CNAME" }
if ($conflict) {
    Write-Host "Found conflicting CNAME record for costloci.com. Removing it to clear 'Cross-User Banned' error..." -ForegroundColor Yellow
    Invoke-RestMethod -Method Delete `
        -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$($conflict.id)" `
        -Headers @{ "Authorization" = "Bearer $CF_API_TOKEN" }
}

# 2. Add CNAME for Backend (api.costloci.com -> Vercel)
$dnsRecordBody = @{
    type    = "CNAME"
    name    = $BACKEND_SUBDOMAIN
    content = $VERCEL_CNAME
    ttl     = 1
    proxied = $false
} | ConvertTo-Json

Write-Host "Creating CNAME record for api.costloci.com..."
$response = Invoke-RestMethod -Method Post `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
    -Headers @{ "Authorization" = "Bearer $CF_API_TOKEN"; "Content-Type" = "application/json" } `
    -Body $dnsRecordBody

if ($response.success) {
    Write-Host "Backend DNS Record (api) Created Successfully." -ForegroundColor Green
} else {
    Write-Host "Backend DNS Record (api) already exists or skipped." -ForegroundColor Gray
}

# 3. Add CNAME for WWW (www.costloci.com -> Pages)
$wwwRecordBody = @{
    type    = "CNAME"
    name    = $WWW_SUBDOMAIN
    content = $PAGES_TARGET
    ttl     = 1
    proxied = $true
} | ConvertTo-Json

Write-Host "Creating CNAME record for www.costloci.com..."
$responseWWW = Invoke-RestMethod -Method Post `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
    -Headers @{ "Authorization" = "Bearer $CF_API_TOKEN"; "Content-Type" = "application/json" } `
    -Body $wwwRecordBody

if ($responseWWW.success) {
    Write-Host "WWW DNS Record Created Successfully." -ForegroundColor Green
} else {
    Write-Host "WWW DNS Record already exists or skipped." -ForegroundColor Gray
}

# 4. Automate the Pages Handshake (Resolving Error 1014)
Write-Host "`nFinalizing Pages Handshake for costloci.com and www.costloci.com..." -ForegroundColor Cyan

$domainsToLink = @("costloci.com", "www.costloci.com")

foreach ($domain in $domainsToLink) {
    Write-Host "Linking $domain to project $PAGES_PROJECT..."
    $pagesBody = @{
        name = $domain
    } | ConvertTo-Json

    $pagesUrl = "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PAGES_PROJECT/domains"
    
    try {
        $res = Invoke-RestMethod -Method Post -Uri $pagesUrl `
            -Headers @{ "Authorization" = "Bearer $CF_API_TOKEN"; "Content-Type" = "application/json" } `
            -Body $pagesBody
        
        if ($res.success) {
            Write-Host "Successfully linked $domain!" -ForegroundColor Green
        } else {
            Write-Host "$domain is already linked or error: $($res.errors.message)" -ForegroundColor Gray
        }
    } catch {
        $errorMessage = $_.Exception.Message
        Write-Host ("Error linking {0}: {1}" -f $domain, $errorMessage) -ForegroundColor Red
    }
}

Write-Host "`nDNS Automation script complete." -ForegroundColor Cyan
