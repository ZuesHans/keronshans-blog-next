# deploy.ps1 - build and deploy script
# Usage: powershell -File deploy.ps1
param([switch]$SkipGit,[switch]$SkipBuild)

$ErrorActionPreference="Stop"
$BlogRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $BlogRoot

Write-Host "===== Keronshans Blog Deploy =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "[0/6] Git status..." -ForegroundColor Yellow
if(git status --porcelain){
  Write-Host "  Uncommitted changes found" -ForegroundColor Gray
}else{
  Write-Host "  No uncommitted changes" -ForegroundColor Gray
}

if(-not $SkipBuild){
  Write-Host ""
  Write-Host "[1/6] Building..." -ForegroundColor Yellow
  node scripts/with-wrangler-env.cjs opennextjs-cloudflare build
  if($LASTEXITCODE-ne 0){Write-Host "Build failed!" -ForegroundColor Red;Pop-Location;exit 1}
}else{
  Write-Host ""
  Write-Host "[1/6] Skip build (--SkipBuild)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/6] Copy pre-rendered HTML..." -ForegroundColor Yellow
$sa=Join-Path $BlogRoot ".next\server\app"
$ad=Join-Path $BlogRoot ".open-next\assets"
if(Test-Path $sa){
  robocopy $sa $ad *.html /s /njh /njs /ndl /np /nfl /ndl|Out-Null
  Write-Host "  HTML files copied" -ForegroundColor Gray
  $nf=Join-Path $sa "_not-found.html"
  $nd=Join-Path $ad "404.html"
  if(Test-Path $nf){Copy-Item $nf $nd -Force;Write-Host "  404.html copied" -ForegroundColor Gray}
}else{Write-Host "  Warning: server app dir not found" -ForegroundColor Red}

Write-Host ""
Write-Host "[3/6] Patch worker.js..." -ForegroundColor Yellow
$wj=Join-Path $BlogRoot ".open-next\worker.js"
$wc=Get-Content $wj -Raw
if($wc -notmatch "PATCH: static asset priority"){
  $q=[char]34
  $L1="            // PATCH: static asset priority"
  $L2="            try {"
  $L3="                const url = new URL(request.url);"
  $L4="                let assetPath = url.pathname;"
  $L5="                if (assetPath === $q/$q) assetPath = $q/index.html$q;"
  $L6="                if (!assetPath.includes($q.$q) && !assetPath.startsWith($q/api$q) && !assetPath.startsWith($q/_next$q)) {"
  $L7="                    assetPath += $q.html$q;"
  $L8="                }"
  $L9="                const assetUrl = new URL(assetPath, request.url);"
  $L10="                const assetResp = await env.ASSETS?.fetch?.(new Request(assetUrl, request));"
  $L11="                if (assetResp && assetResp.status === 200) {"
  $L12="                    return assetResp;"
  $L13="                }"
  $L14="            } catch (e) {}"
  $patchInsert=($L1,$L2,$L3,$L4,$L5,$L6,$L7,$L8,$L9,$L10,$L11,$L12,$L13,$L14) -join [char]13+[char]10
  $marker="            const response = maybeGetSkewProtectionResponse(request);"
  $wc=$wc.Replace($marker,"$patchInsert" + [char]13 + [char]10 + "$marker")
  Set-Content $wj -Value $wc -NoNewline -Encoding utf8
  Write-Host "  worker.js patched" -ForegroundColor Gray
}else{Write-Host "  Already patched, skip" -ForegroundColor Gray}

Write-Host ""
Write-Host "[4/6] Deploy to Cloudflare Workers..." -ForegroundColor Yellow
node scripts/with-wrangler-env.cjs wrangler deploy
if($LASTEXITCODE-ne 0){Write-Host "Deploy failed!" -ForegroundColor Red;Pop-Location;exit 1}
Write-Host "  Deployed!" -ForegroundColor Green

if(-not $SkipGit){
  Write-Host ""
  Write-Host "[5/6] Git commit and push..." -ForegroundColor Yellow
  git add -A
  $cm="chore: deploy "+(Get-Date -Format "yyyy-MM-dd HH:mm")
  git commit -m $cm
  Write-Host "  Committed: $cm" -ForegroundColor Gray
  $ru=git remote get-url origin 2>$null
  if($ru){git push origin main;Write-Host "  Pushed to GitHub" -ForegroundColor Green}else{Write-Host "  No remote, skip push" -ForegroundColor Yellow}
}else{
  Write-Host ""
  Write-Host "[5/6] Skip Git (--SkipGit)" -ForegroundColor Gray
}

Pop-Location
Write-Host ""
Write-Host "===== Done! =====" -ForegroundColor Green
