# Quick Electron Rebuild Script
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Quick Electron Build" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Kill any running instances
Write-Host "Stopping any running instances..." -ForegroundColor Yellow
taskkill /F /IM "E621 Horizon.exe" 2>$null | Out-Null
taskkill /F /IM "electron.exe" 2>$null | Out-Null
Start-Sleep -Seconds 2

# Build
Write-Host "Building Electron package..." -ForegroundColor Yellow
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npx electron-builder --config electron-builder.yml --dir

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build successful!" -ForegroundColor Green
    $exePath = "dist\win-unpacked\E621 Horizon.exe"
    if (Test-Path $exePath) {
        Write-Host "Executable: $exePath" -ForegroundColor Green
        $runNow = Read-Host "Run now? (y/n)"
        if ($runNow -eq "y") {
            Start-Process -FilePath $exePath
        }
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}
