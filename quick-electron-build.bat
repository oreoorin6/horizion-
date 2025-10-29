@echo off
title Quick Electron Build (No Code Signing)
color 0A

echo.
echo ========================================
echo    Quick Electron Build (No Signing)
echo ========================================
echo.
echo This script assumes Next.js build is already complete.
echo It will only run the Electron packaging step with signing disabled.
echo.

REM Clear the problematic code signing cache
echo Clearing electron-builder code signing cache...
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" 2>nul
    echo Cache cleared.
) else (
    echo Cache already clear.
)
echo.

REM Set environment variables to skip code signing
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set DEBUG=electron-builder

echo Running electron-builder (dir target, no signing)...
echo.

call npx electron-builder --win dir --config.win.sign=null

echo.
if errorlevel 1 (
    echo.
    echo Build completed with warnings (this is normal for unsigned builds)
) else (
    echo.
    echo Build completed successfully!
)
echo.

REM Check if executable was created
if exist "dist\win-unpacked\E621 Horizon.exe" (
    echo.
    echo ========================================
    echo          Build Successful!
    echo ========================================
    echo.
    echo Output: dist\win-unpacked\E621 Horizon.exe
    echo.
    set /p run="Run the app now? (y/n): "
    if /i "%run%"=="y" (
        start "" "dist\win-unpacked\E621 Horizon.exe"
    )
) else (
    echo.
    echo ========================================
    echo         Build May Have Failed
    echo ========================================
    echo.
    echo Check the dist folder to see if files were created.
)

echo.
pause
