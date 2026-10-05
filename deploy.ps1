# Local operator entry point; GitHub uses the same npm build/deploy commands.
param([switch]$SkipGit, [switch]$SkipBuild, [string]$SiteUrl = 'https://keronshans.top')
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  if (-not $SkipBuild) {
    npm run check
    if ($LASTEXITCODE -ne 0) { throw 'Release checks failed' }
    npm run build:cloudflare
    if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
  }
  npm run deploy:built
  if ($LASTEXITCODE -ne 0) { throw 'Deployment failed' }
  npm run check:site -- $SiteUrl
  if ($LASTEXITCODE -ne 0) { throw 'Release health check failed; inspect Worker versions before rollback' }
} finally { Pop-Location }
