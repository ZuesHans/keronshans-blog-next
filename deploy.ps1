# deploy.ps1 - 构建部署脚本
# 用法: powershell -File deploy.ps1

$ErrorActionPreference = "Stop"
$BlogRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "===== Keronshans Blog Deploy =====" -ForegroundColor Cyan

# 1. 构建
Write-Host ""
Write-Host "[1/4] 构建项目..." -ForegroundColor Yellow
Push-Location $BlogRoot
npx opennextjs-cloudflare build
if ($LASTEXITCODE -ne 0) { Write-Host "构建失败!" -ForegroundColor Red; Pop-Location; exit 1 }

# 2. 递归复制所有预渲染 HTML 到 assets（保持目录结构）
Write-Host ""
Write-Host "[2/4] 复制预渲染页面到 assets..." -ForegroundColor Yellow
$serverApp = Join-Path $BlogRoot ".next\server\app"
$assetsDir = Join-Path $BlogRoot ".open-next\assets"

if (Test-Path $serverApp) {
    # 用 robocopy 高效复制所有 .html，保持目录结构
    robocopy $serverApp $assetsDir *.html /s /njh /njs /ndl /np /nfl /ndl
    # robocopy 退出码 0-7 都算成功
    Write-Host "  已复制所有预渲染 HTML 文件" -ForegroundColor Gray

    # 404 页面
    $notFoundSrc = Join-Path $serverApp "_not-found.html"
    $notFoundDst = Join-Path $assetsDir "404.html"
    if (Test-Path $notFoundSrc) {
        Copy-Item $notFoundSrc $notFoundDst -Force
        Write-Host "  _not-found.html -> 404.html" -ForegroundColor Gray
    }
} else {
    Write-Host "  警告: 未找到 $serverApp" -ForegroundColor Red
}

# 3. 修改 worker.js - 在 Worker 处理前优先检查静态资源
Write-Host ""
Write-Host "[3/4] 修改 worker.js (静态资源优先)..." -ForegroundColor Yellow
$workerJs = Join-Path $BlogRoot ".open-next\worker.js"
$content = Get-Content $workerJs -Raw

$patchPattern = "PATCH: static asset priority"
if ($content -notmatch [regex]::Escape($patchPattern)) {
    $q = [char]34
    $line1 = "            // PATCH: static asset priority"
    $line2 = "            try {"
    $line3 = "                const url = new URL(request.url);"
    $line4 = "                let assetPath = url.pathname;"
    $line5 = "                if (assetPath === ${q}/${q}) assetPath = ${q}/index.html${q};"
    $line6 = "                if (!assetPath.includes(${q}.${q}) && !assetPath.startsWith(${q}/api${q}) && !assetPath.startsWith(${q}/_next${q})) {"
    $line7 = "                    assetPath += ${q}.html${q};"
    $line8 = "                }"
    $line9 = "                const assetUrl = new URL(assetPath, request.url);"
    $line10 = "                const assetResp = await env.ASSETS?.fetch?.(new Request(assetUrl, request));"
    $line11 = "                if (assetResp && assetResp.status === 200) {"
    $line12 = "                    return assetResp;"
    $line13 = "                }"
    $line14 = "            } catch (e) {}"
    $patchInsert = @($line1,$line2,$line3,$line4,$line5,$line6,$line7,$line8,$line9,$line10,$line11,$line12,$line13,$line14) -join "`r`n"

    $marker = "            const response = maybeGetSkewProtectionResponse(request);"
    $content = $content.Replace($marker, "$patchInsert`r`n$marker")
    Set-Content $workerJs -Value $content -NoNewline
    Write-Host "  worker.js patched" -ForegroundColor Gray
} else {
    Write-Host "  worker.js already patched, skip" -ForegroundColor Gray
}

# 4. 部署
Write-Host ""
Write-Host "[4/4] deploy to Cloudflare..." -ForegroundColor Yellow
npx wrangler deploy
if ($LASTEXITCODE -ne 0) { Write-Host "deploy failed!" -ForegroundColor Red; Pop-Location; exit 1 }

Pop-Location
Write-Host ""
Write-Host "===== deploy done! keronshans.top =====" -ForegroundColor Green
