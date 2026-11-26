@echo off
title Build Standalone Windows .exe - Levitate3D Supplier Terminal
echo ========================================================
echo  Building Standalone Windows .exe Installer (Option A)
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [INFO] Installing required build dependencies...
    call npm install
)

echo [INFO] Packaging executable into dist/ folder...
call npm run build:exe

echo.
echo [SUCCESS] Standalone Windows installer generated in dist\ folder.
pause
