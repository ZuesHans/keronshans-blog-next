# Sync local blog posts to the semantic-search server and rebuild the vector index.
param(
  [string]$Remote = "ubuntu@175.178.216.243",
  [string]$RemoteTempPosts = "/home/ubuntu/posts",
  [string]$RemotePostsDir = "/opt/keronshans_blogsorce/content/posts",
  [string]$RemoteSearchDir = "/opt/semantic-blog-search"
)

$ErrorActionPreference = "Stop"
$BlogRoot = Split-Path -Parent $PSScriptRoot
$LocalPosts = Join-Path $BlogRoot "content\posts"

function Run-Checked {
  param(
    [string]$Label,
    [string]$Command,
    [string[]]$Arguments
  )

  Write-Host ""
  Write-Host "[$Label] $Command $($Arguments -join ' ')" -ForegroundColor Yellow
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
}

Write-Host "===== Sync Semantic Search Index =====" -ForegroundColor Cyan

if (-not (Test-Path $LocalPosts)) {
  throw "Local posts directory not found: $LocalPosts"
}

Get-Command scp -ErrorAction Stop | Out-Null
Get-Command ssh -ErrorAction Stop | Out-Null

Run-Checked "Clean remote temp posts" "ssh" @($Remote, "rm -rf '$RemoteTempPosts'")
Run-Checked "Upload local posts" "scp" @("-r", $LocalPosts, "${Remote}:/home/ubuntu/")

$RemoteScript = @"
set -euo pipefail

if [ ! -d "$RemoteTempPosts" ]; then
  echo "Remote temp posts directory not found: $RemoteTempPosts" >&2
  exit 1
fi

mkdir -p "$(dirname "$RemotePostsDir")"
rm -rf "$RemotePostsDir"
mv "$RemoteTempPosts" "$RemotePostsDir"

cd "$RemoteSearchDir"
. .venv/bin/activate
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 python scripts/sync_index.py --config config.yaml
"@

Write-Host ""
Write-Host "[Run remote incremental index]" -ForegroundColor Yellow
$RemoteScript | ssh $Remote "bash -s"
if ($LASTEXITCODE -ne 0) {
  throw "Remote index sync failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "===== 搜索索引已更新 =====" -ForegroundColor Green
