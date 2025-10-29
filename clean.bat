@echo off
title E621 Horizon - Clean Build Files
color 0C

echo.
echo ========================================
echo    E621 Horizon - Clean Build Files
echo ========================================
echo.
echo This script will remove all build artifacts:
echo   - dist/ (Electron build output)
echo   - .next/ (Next.js build cache)
echo   - out/ (Next.js static export)
echo   - node_modules\.cache/ (Build caches)
echo.

set /p confirm="Do you want to continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo.
    echo Cleanup cancelled.
    echo.
    pause
    exit /b
)

echo.
echo Starting cleanup...
echo.

set folders_removed=0
set folders_skipped=0

REM Remove dist folder
if exist "dist" (
    echo Removing: dist (Electron build output)
    rmdir /s /q "dist" 2>nul
    if exist "dist" (
        echo   [WARNING] Could not remove completely
        set /a folders_skipped+=1
    ) else (
        echo   [OK] Removed successfully
        set /a folders_removed+=1
    )
    echo.
) else (
    echo Skipping: dist (doesn't exist)
    echo.
)

REM Remove .next folder
if exist ".next" (
    echo Removing: .next (Next.js build cache)
    rmdir /s /q ".next" 2>nul
    if exist ".next" (
        echo   [WARNING] Could not remove completely
        set /a folders_skipped+=1
    ) else (
        echo   [OK] Removed successfully
        set /a folders_removed+=1
    )
    echo.
) else (
    echo Skipping: .next (doesn't exist)
    echo.
)

REM Remove out folder
if exist "out" (
    echo Removing: out (Next.js static export)
    rmdir /s /q "out" 2>nul
    if exist "out" (
        echo   [WARNING] Could not remove completely
        set /a folders_skipped+=1
    ) else (
        echo   [OK] Removed successfully
        set /a folders_removed+=1
    )
    echo.
) else (
    echo Skipping: out (doesn't exist)
    echo.
)

REM Remove node_modules cache
if exist "node_modules\.cache" (
    echo Removing: node_modules\.cache (Build caches)
    rmdir /s /q "node_modules\.cache" 2>nul
    if exist "node_modules\.cache" (
        echo   [WARNING] Could not remove completely
        set /a folders_skipped+=1
    ) else (
        echo   [OK] Removed successfully
        set /a folders_removed+=1
    )
    echo.
) else (
    echo Skipping: node_modules\.cache (doesn't exist)
    echo.
)

REM Summary
echo ========================================
echo          Cleanup Summary
echo ========================================
echo.
echo Folders removed: %folders_removed%
echo Folders skipped: %folders_skipped%
echo.

if %folders_skipped% gtr 0 (
    echo Note: Some folders could not be removed.
    echo This may be because:
    echo   - Files are in use by another process
    echo   - Insufficient permissions
    echo   - Files are locked
    echo.
    echo Try closing all related applications and run this script again.
    echo.
)

echo Cleanup complete!
echo.
pause
