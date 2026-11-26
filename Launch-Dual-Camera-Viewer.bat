@echo off
title Dual Camera Real-Time Video Testing Studio
echo ================================================================
echo   Launching Dual Camera Real-Time Video Testing Studio
echo   Device: Camera201 (USB VID_32E4 ^& PID_A201)
echo ================================================================

set HTML_PATH=%~dp0camera-test.html

REM Check if Microsoft Edge is available (default on Windows 10/11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH%" --window-size=1280,880
    exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="file:///%HTML_PATH%" --window-size=1280,880
    exit /b 0
)

REM Fallback to Google Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="file:///%HTML_PATH%" --window-size=1280,880
    exit /b 0
)

REM Fallback to Default Windows Browser
start "" "%HTML_PATH%"
exit /b 0
