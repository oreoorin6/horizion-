param(
    [string]$Ref = "origin/main",
    [switch]$NoInstall
)

Write-Host "Restoring package.json and package-lock.json from $Ref" -ForegroundColor Cyan

# Ensure git is available
try { Get-Command git -ErrorAction Stop | Out-Null } catch {
  Write-Host "git is required for restore" -ForegroundColor Red; exit 1
}

# Backup current files
New-Item -ItemType Directory -Force -Path ".backup" | Out-Null
if (Test-Path package.json) { Copy-Item package.json .backup\package.json.bak -Force }
if (Test-Path package-lock.json) { Copy-Item package-lock.json .backup\package-lock.json.bak -Force }

# Restore from ref
$restoreSucceeded = $true
try {
  git checkout -- "$Ref" -- package.json 2>$null
} catch { $restoreSucceeded = $false }

if (-not (Test-Path package.json)) { $restoreSucceeded = $false }

# Try restore lockfile too if present in ref
try {
  git checkout -- "$Ref" -- package-lock.json 2>$null
} catch { Write-Warning "Could not restore package-lock.json from $Ref`: $_" }

if (-not $restoreSucceeded) {
  Write-Host "Could not restore from $Ref. Leaving backups in .backup" -ForegroundColor Yellow
  exit 1
}

Write-Host "✓ Files restored from $Ref" -ForegroundColor Green

if (-not $NoInstall) {
  Write-Host "Installing dependencies..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed; attempting cache clear and retry" -ForegroundColor Yellow
    npm cache clean --force | Out-Null
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "Install failed after retry" -ForegroundColor Red; exit 1 }
  }
  Write-Host "✓ Dependencies installed" -ForegroundColor Green
}
