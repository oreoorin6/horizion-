@echo off
title E621 Horizon - Launcher
color 0B

echo.
echo ========================================
echo         E621 Horizon Launcher
echo ========================================
echo.
echo Choose your preferred script:
echo.
echo [1] Run Batch Script (build.bat)
echo [2] Run PowerShell Script (build.ps1) - Recommended
echo [3] Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto batch
if "%choice%"=="2" goto powershell
if "%choice%"=="3" goto exit
goto invalid

:batch
echo.
echo Running batch script...
call build.bat
goto end

:powershell
echo.
echo Running PowerShell script...
powershell -ExecutionPolicy Bypass -File build.ps1
goto end

:invalid
echo.
echo Invalid choice! Please enter 1, 2, or 3.
timeout /t 2 > nul
cls
goto start

:exit
echo.
echo Exiting...
goto end

:start
goto :eof

:end
echo.
pause