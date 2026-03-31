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

if ($content -notmatch "PATCH") {
    # 逐行构建 patch 内容，避免 PowerShell here-string 转义问题
    $patchLines = @(
        "            // PATCH: static asset priority",
        "            try {",
        "                const url = new URL(request.url);",
        "                let assetPath = url.pathname;",
        [char]34 + "                if (assetPath === " + [char]34 + "/" + [char]34 + ") assetPath = " + [char]34 + "/index.html" + [char]34 + ";",
        "                if (!assetPath.includes(" + [char]34 + "." + [char]34 + ") && !assetPath.startsWith(" + [char]34 + "/api" + [char]34 + ") && !assetPath.startsWith(" + [char]34 + "/_next" + [char]34 + ")) {",
        "                    assetPath += " + [char]34 + ".html" + [char]34 + ";",
        "                }",
        "                const assetUrl = new URL(assetPath, request.url);",
        "                const assetResp = await env.ASSETS?.fetch?.(new Request(assetUrl, request));",
        "                if (assetResp && assetResp.status === 200) {",
        "                    return assetResp;",
        "                }",
        "            } catch (e) {}"
    )
    $patchInsert = $patchLines -join "`r`n"

    $marker = "            const response = maybeGetSkewProtectionResponse(request);"
    $content = $content.Replace($marker, "$patchInsert`r`n$marker")
    Set-Content $workerJs -Value $content -NoNewline
    Write-Host "  worker.js 已修改" -ForegroundColor Gray
} else {
    Write-Host "  worker.js 已包含 patch, skip" -ForegroundColor Gray
}

# 4. 部署
Write-Host ""
Write-Host "[4/4] deploy to Cloudflare..." -ForegroundColor Yellow
npx wrangler deploy
if ($LASTEXITCODE -ne 0) { Write-Host "deploy failed!" -ForegroundColor Red; Pop-Location; exit 1 }

Pop-Location
Write-Host ""
Write-Host "===== deploy done! keronshans.top =====" -ForegroundColor Green
