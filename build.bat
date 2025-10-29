@echo off
title E621 Horizon - Build Script
color 0A

echo.
echo ========================================
echo         E621 Horizon Build Script
echo ========================================
echo.
echo Please select build mode:
echo.
echo [1] Development Mode (Dev Server + Electron)
echo [2] Production Build (Build + Package)
echo [3] Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto production
if "%choice%"=="3" goto exit
goto invalid

:dev
echo.
echo ========================================
echo      Starting Development Mode...
echo ========================================
echo.
echo Starting Next.js development server...
start "Next.js Dev Server" cmd /k "npm run dev"
echo.
echo Waiting for dev server to start...
timeout /t 5 /nobreak > nul
echo.
echo Starting Electron application...
npm run electron-dev
goto end

:production
echo.
echo ========================================
echo      Starting Production Build...
echo ========================================
echo.
echo Step 0: Cleaning up old build files...
echo   Stopping running app processes (if any)...
taskkill /F /IM "E621 Horizon.exe" >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 1 /nobreak > nul
if exist "dist" (
    echo   Removing old dist folder...
    rmdir /s /q "dist" 2>nul
    if exist "dist" (
        echo   Warning: Could not remove dist folder completely, retrying...
        timeout /t 1 /nobreak > nul
        rmdir /s /q "dist" 2>nul
        if exist "dist" (
            echo   Warning: Still could not remove dist. Continuing...
        ) else (
            echo   [OK] Old dist folder removed
        )
    ) else (
        echo   [OK] Old dist folder removed
    )
)
if exist ".next" (
    echo   Removing old .next folder...
    rmdir /s /q ".next" 2>nul
    if exist ".next" (
        echo   Warning: Could not remove .next folder completely
        echo   Attempting to continue anyway...
    ) else (
        echo   [OK] Old .next folder removed
    )
)
if exist "out" (
    echo   Removing old out folder...
    rmdir /s /q "out" 2>nul
    if exist "out" (
        echo   Warning: Could not remove out folder completely
        echo   Attempting to continue anyway...
    ) else (
        echo   [OK] Old out folder removed
    )
)
echo.
echo Step 1: Installing/updating dependencies...
call npm install
if errorlevel 1 (
    echo WARNING: npm install failed. Attempting dependency repair...
    echo   - Cleaning npm cache
    call npm cache clean --force >nul 2>&1
    echo   - Removing node_modules and package-lock.json
    if exist "node_modules" rmdir /s /q "node_modules"
    if exist "package-lock.json" del /f /q "package-lock.json"
    echo   - Re-installing dependencies (try npm ci then npm install)
    if exist "package-lock.json" (
        call npm ci
    ) else (
        call npm install
    )
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies after repair attempts
        pause
        goto end
    ) else (
        echo [OK] Dependencies repaired and installed
    )
)
echo.
echo Step 2: Building Next.js application...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build Next.js application
    pause
    goto end
)
echo.
echo Step 3: Building Electron application (unpacked)...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npx electron-builder --config electron-builder.yml
if errorlevel 1 (
    echo WARNING: electron-builder failed. Clearing caches to force re-download and retrying...
    set "EBC1=%LOCALAPPDATA%\electron-builder\Cache"
    set "EBC2=%LOCALAPPDATA%\electron\Cache"
    set "EBC3=%LOCALAPPDATA%\electron-builder\nsis"
    set "EBC4=%LOCALAPPDATA%\electron-builder\winCodeSign"
    if exist "%EBC1%" rmdir /s /q "%EBC1%"
    if exist "%EBC2%" rmdir /s /q "%EBC2%"
    if exist "%EBC3%" rmdir /s /q "%EBC3%"
    if exist "%EBC4%" rmdir /s /q "%EBC4%"
    echo   - Retrying electron-builder with fresh downloads...
    call npx electron-builder --config electron-builder.yml
    if errorlevel 1 (
        echo ERROR: electron-builder failed after cache clear retry
        pause
        goto end
    ) else (
        echo [OK] electron-builder succeeded after retry
    )
)
echo.
echo Production build complete!
echo Check the 'dist' folder for output files.
echo.
echo To run the production app:
echo   - Navigate to dist/win-unpacked/
echo   - Run E621 Horizon.exe
echo.
pause
goto end

:invalid
echo.
echo Invalid choice! Please enter 1, 2, or 3.
echo.
pause
goto start

:exit
echo.
echo Exiting...
goto end

:start
cls
goto :eof

:end
echo.
echo Press any key to exit...
pause > nul