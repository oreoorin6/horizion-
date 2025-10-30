$ErrorActionPreference = 'Stop'

# Store a GitHub token securely for this Windows user using DPAPI-backed SecureString.
# The token is saved encrypted at: %APPDATA%\E621Horizon\secrets\gh_token.dat

$baseDir = Join-Path $env:APPDATA 'E621Horizon\secrets'
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null

Write-Host 'Enter your GitHub Personal Access Token (input is hidden):' -ForegroundColor Cyan
$sec = Read-Host -AsSecureString

if (-not $sec) {
  Write-Error 'No token entered. Aborting.'
  exit 1
}

$enc = ConvertFrom-SecureString $sec
$dest = Join-Path $baseDir 'gh_token.dat'
Set-Content -Path $dest -Value $enc -NoNewline

Write-Host "Token stored at: $dest" -ForegroundColor Green
Write-Host 'Note: Encrypted and tied to your Windows account; use scripts\upload-release-asset.ps1 without -Token to auto-load.' -ForegroundColor Yellow
