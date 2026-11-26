@echo off
title Levitate3D Supplier Terminal
echo ========================================================
echo  Levitate3D - Supplier Manufacturing Terminal (Option A)
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
)

echo [INFO] Launching isolated desktop client...
call npm start
pause
