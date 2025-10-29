# E621 Horizon Build Script
# PowerShell version with better error handling

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "        E621 Horizon Build Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

do {
    Write-Host "Please select build mode:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[1] Development Mode (Dev Server + Electron)" -ForegroundColor Yellow
    Write-Host "[2] Production Build (Build + Package)" -ForegroundColor Yellow
    Write-Host "[3] Quick Dev (Just Electron with existing build)" -ForegroundColor Yellow
    Write-Host "[4] Exit" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "     Starting Development Mode..." -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            
            Write-Host "Starting Next.js development server..." -ForegroundColor Cyan
            
            # Start dev server in background
            $devServer = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Normal
            
            Write-Host "Waiting for dev server to start..." -ForegroundColor Cyan
            Start-Sleep -Seconds 8
            
            Write-Host "Starting Electron application..." -ForegroundColor Cyan
            try {
                npm run electron-dev
            }
            catch {
                Write-Host "Error starting Electron: $_" -ForegroundColor Red
            }
            finally {
                # Clean up dev server
                if ($devServer -and !$devServer.HasExited) {
                    Write-Host "Stopping development server..." -ForegroundColor Yellow
                    Stop-Process -Id $devServer.Id -Force -ErrorAction SilentlyContinue
                }
            }
            break
        }
        
        "2" {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "     Starting Production Build..." -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            
            try {
                # Step 0: Clean up old build files
                Write-Host "Step 0: Cleaning up old build files..." -ForegroundColor Cyan

                # Ensure no running processes are locking dist (Electron/EXE)
                Write-Host "  Stopping running app processes (if any)..." -ForegroundColor Yellow
                try {
                    Get-Process | Where-Object { $_.ProcessName -like "E621*" -or $_.ProcessName -like "electron*" } | ForEach-Object {
                        try { Stop-Process -Id $_.Id -Force -ErrorAction Stop } catch {}
                    }
                    Start-Sleep -Seconds 1
                } catch {}
                
                # Remove dist folder if it exists (retry a couple times in case Defender locks files)
                if (Test-Path "dist") {
                    Write-Host "  Removing old dist folder..." -ForegroundColor Yellow
                    $removed = $false
                    for ($i=0; $i -lt 3 -and -not $removed; $i++) {
                        try {
                            Remove-Item -Path "dist" -Recurse -Force -ErrorAction Stop
                            $removed = $true
                            Write-Host "  ✓ Old dist folder removed" -ForegroundColor Green
                        } catch {
                            Write-Host "  ⚠ Dist removal attempt $($i+1) failed, retrying..." -ForegroundColor Yellow
                            Start-Sleep -Seconds 1
                        }
                    }
                    if (-not $removed) {
                        Write-Host "  ⚠ Warning: Could not remove dist folder completely. Continuing..." -ForegroundColor Yellow
                    }
                }
                
                # Remove .next folder if it exists
                if (Test-Path ".next") {
                    Write-Host "  Removing old .next folder..." -ForegroundColor Yellow
                    try {
                        Remove-Item -Path ".next" -Recurse -Force -ErrorAction Stop
                        Write-Host "  ✓ Old .next folder removed" -ForegroundColor Green
                    }
                    catch {
                        Write-Host "  ⚠ Warning: Could not remove .next folder completely: $_" -ForegroundColor Yellow
                        Write-Host "  Attempting to continue anyway..." -ForegroundColor Yellow
                    }
                }
                
                # Remove out folder if it exists
                if (Test-Path "out") {
                    Write-Host "  Removing old out folder..." -ForegroundColor Yellow
                    try {
                        Remove-Item -Path "out" -Recurse -Force -ErrorAction Stop
                        Write-Host "  ✓ Old out folder removed" -ForegroundColor Green
                    }
                    catch {
                        Write-Host "  ⚠ Warning: Could not remove out folder completely: $_" -ForegroundColor Yellow
                        Write-Host "  Attempting to continue anyway..." -ForegroundColor Yellow
                    }
                }
                
                Write-Host "" 
                Write-Host "Step 1: Installing/updating dependencies..." -ForegroundColor Cyan
                npm install
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "  ⚠ npm install failed. Attempting dependency repair..." -ForegroundColor Yellow
                    try {
                        Write-Host "    - Cleaning npm cache" -ForegroundColor Yellow
                        npm cache clean --force | Out-Null
                    } catch {}
                    try {
                        Write-Host "    - Removing node_modules and package-lock.json" -ForegroundColor Yellow
                        if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue }
                        if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue }
                    } catch {}
                    Write-Host "    - Re-installing dependencies (npm ci fallback to npm install)" -ForegroundColor Yellow
                    if (Test-Path "package-lock.json") {
                        npm ci
                    } else {
                        npm install
                    }
                    if ($LASTEXITCODE -ne 0) {
                        throw "Failed to install dependencies after repair attempts"
                    } else {
                        Write-Host "  ✓ Dependencies repaired and installed" -ForegroundColor Green
                    }
                }
                
                Write-Host "Step 2: Building Next.js application..." -ForegroundColor Cyan
                npm run build
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to build Next.js application"
                }
                
                Write-Host "Step 3: Building Electron application..." -ForegroundColor Cyan
                $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
                npx electron-builder --config electron-builder.yml
                $builderExit = $LASTEXITCODE
                if ($builderExit -ne 0) {
                    Write-Host "  ⚠ electron-builder failed (exit $builderExit). Attempting to clear caches and retry..." -ForegroundColor Yellow
                    # Common electron/electron-builder caches on Windows
                    $cachePaths = @(
                        Join-Path $env:LOCALAPPDATA "electron-builder\Cache",
                        Join-Path $env:LOCALAPPDATA "electron\Cache",
                        Join-Path $env:LOCALAPPDATA "electron-builder\nsis",
                        Join-Path $env:LOCALAPPDATA "electron-builder\winCodeSign"
                    )
                    foreach ($p in $cachePaths) {
                        try {
                            if (Test-Path $p) {
                                Write-Host "    - Removing cache: $p" -ForegroundColor Yellow
                                Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
                            }
                        } catch {}
                    }
                    Write-Host "    - Retrying electron-builder (fresh downloads)" -ForegroundColor Yellow
                    npx electron-builder --config electron-builder.yml
                    if ($LASTEXITCODE -ne 0) {
                        throw "electron-builder failed after cache clear retry"
                    } else {
                        Write-Host "  ✓ electron-builder succeeded after retry" -ForegroundColor Green
                    }
                }
                
                Write-Host ""
                Write-Host "Production build complete!" -ForegroundColor Green
                Write-Host "Check the 'dist' folder for output files." -ForegroundColor Green
                Write-Host ""
                Write-Host "To run the production app:" -ForegroundColor Yellow
                Write-Host "  - Navigate to dist/win-unpacked/" -ForegroundColor Yellow
                Write-Host "  - Run 'E621 Horizon.exe'" -ForegroundColor Yellow
                
                # Check if the executable was created
                $exePath = "dist\win-unpacked\E621 Horizon.exe"
                if (Test-Path $exePath) {
                    Write-Host ""
                    $runNow = Read-Host "Would you like to run the app now? (y/n)"
                    if ($runNow -eq "y" -or $runNow -eq "Y") {
                        Start-Process -FilePath $exePath
                    }
                }
            }
            catch {
                Write-Host "ERROR: $_" -ForegroundColor Red
                Write-Host "Build process failed. Check the error messages above." -ForegroundColor Red
            }
            break
        }
        
        "3" {
            Write-Host ""
            Write-Host "Starting Electron with existing build..." -ForegroundColor Cyan
            try {
                npm run electron
            }
            catch {
                Write-Host "Error: $_" -ForegroundColor Red
                Write-Host "Make sure you have run 'npm run build' first." -ForegroundColor Yellow
            }
            break
        }
        
        "4" {
            Write-Host ""
            Write-Host "Exiting..." -ForegroundColor Yellow
            return
        }
        
        default {
            Write-Host ""
            Write-Host "Invalid choice! Please enter 1, 2, 3, or 4." -ForegroundColor Red
            Write-Host ""
            Start-Sleep -Seconds 2
            continue
        }
    }
    
    Write-Host ""
    $continue = Read-Host "Would you like to perform another action? (y/n)"
    
} while ($continue -eq "y" -or $continue -eq "Y")

Write-Host ""
Write-Host "Goodbye!" -ForegroundColor Green
