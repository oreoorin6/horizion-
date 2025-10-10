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
echo Step 1: Installing/updating dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    goto end
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
call npx electron-builder --win dir
if errorlevel 1 (
    echo WARNING: Electron builder had issues, but unpacked version may be available
    echo Check the dist/win-unpacked folder
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