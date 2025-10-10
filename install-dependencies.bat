@echo off
setlocal enabledelayedexpansion

echo ============================================
echo E621 Horizon - Dependencies Installation
echo ============================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Minimum required version: 18.x
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo Node.js version: !NODE_VERSION!
)

:: Check if npm is available
echo.
echo [2/6] Checking npm availability...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available
    echo npm should come with Node.js installation
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo npm version: !NPM_VERSION!
)

:: Clear npm cache to prevent potential issues
echo.
echo [3/6] Clearing npm cache...
npm cache clean --force
if errorlevel 1 (
    echo WARNING: Failed to clear npm cache, continuing anyway...
)

:: Remove existing node_modules and package-lock.json for clean install
echo.
echo [4/6] Cleaning existing dependencies...
if exist node_modules (
    echo Removing existing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing existing package-lock.json...
    del package-lock.json
)

:: Install all dependencies
echo.
echo [5/6] Installing all dependencies...
echo This may take several minutes depending on your internet connection...
echo.

npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo This could be due to:
    echo - Network connectivity issues
    echo - Node.js version compatibility
    echo - Disk space issues
    echo - Permission issues
    echo.
    echo Please check the error messages above and try again
    pause
    exit /b 1
)

:: Install global development tools (optional but recommended)
echo.
echo [6/6] Installing recommended global development tools...
echo Installing TypeScript globally...
npm install -g typescript >nul 2>&1
if errorlevel 1 (
    echo WARNING: Failed to install TypeScript globally (may require admin privileges)
)

echo Installing tsx globally for TypeScript execution...
npm install -g tsx >nul 2>&1
if errorlevel 1 (
    echo WARNING: Failed to install tsx globally (may require admin privileges)
)

:: Verify installation
echo.
echo ============================================
echo Verifying Installation
echo ============================================

echo.
echo Checking critical dependencies...

:: Check if Next.js is installed
npm list next --depth=0 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Next.js is not properly installed
    exit /b 1
) else (
    echo ✓ Next.js installed
)

:: Check if React is installed
npm list react --depth=0 >nul 2>&1
if errorlevel 1 (
    echo ERROR: React is not properly installed
    exit /b 1
) else (
    echo ✓ React installed
)

:: Check if TypeScript is installed
npm list typescript --depth=0 >nul 2>&1
if errorlevel 1 (
    echo ERROR: TypeScript is not properly installed
    exit /b 1
) else (
    echo ✓ TypeScript installed
)

:: Check if Electron is installed
npm list electron --depth=0 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Electron is not properly installed
    exit /b 1
) else (
    echo ✓ Electron installed
)

:: Check if Tailwind CSS is installed
npm list tailwindcss --depth=0 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Tailwind CSS is not properly installed
    exit /b 1
) else (
    echo ✓ Tailwind CSS installed
)

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo All dependencies have been successfully installed.
echo.
echo Available commands:
echo   npm run dev          - Start development server
echo   npm run build        - Build for production
echo   npm run electron-dev - Start Electron development
echo   npm run dist         - Build Electron distribution
echo.
echo You can now run the development server with:
echo   npm run dev
echo.
echo Press any key to exit...
pause >nul