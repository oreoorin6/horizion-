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
                Write-Host "Step 1: Installing/updating dependencies..." -ForegroundColor Cyan
                npm install
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to install dependencies"
                }
                
                Write-Host "Step 2: Building Next.js application..." -ForegroundColor Cyan
                npm run build
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to build Next.js application"
                }
                
                Write-Host "Step 3: Building Electron application..." -ForegroundColor Cyan
                $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
                npx electron-builder --win dir
                
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