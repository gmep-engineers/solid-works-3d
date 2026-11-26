@echo off
title Levitate3D Supplier Terminal
cd /d "%~dp0"

echo =======================================================
echo   Launching Levitate3D Supplier Terminal (.exe)
echo =======================================================
echo.

if exist "dist\win-unpacked\Levitate3D Supplier Terminal.exe" (
    echo [INFO] Starting standalone executable...
    start "" "dist\win-unpacked\Levitate3D Supplier Terminal.exe" --no-sandbox
) else (
    echo [INFO] Standalone executable not found, launching with npm start...
    npm start -- --no-sandbox
)

exit /b 0
