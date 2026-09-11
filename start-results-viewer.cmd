@echo off
REM ============================================================
REM  Results Viewer launcher (testing output only)
REM  Shows ONLY the parent dashboard + each run's report.md for
REM  the target app — not the whole project's docs.
REM
REM  Usage:
REM    start-results-viewer.cmd              (uses TARGET_APP or the bundled example)
REM    start-results-viewer.cmd my-app       (view a specific app's results)
REM
REM  Then open http://localhost:4400. Keep this window open; Ctrl+C to stop.
REM ============================================================

setlocal

where node >nul 2>nul
if %ERRORLEVEL%==0 (
    set "NODE_EXE=node"
) else if exist "%LOCALAPPDATA%\Kiro-Cli\node.exe" (
    set "NODE_EXE=%LOCALAPPDATA%\Kiro-Cli\node.exe"
) else (
    echo ERROR: Could not find Node.js. Install from https://nodejs.org or ensure Kiro-Cli's node.exe exists.
    pause
    exit /b 1
)

REM Optional first arg = target app; else fall back to TARGET_APP env, else the bundled example.
if not "%~1"=="" set "TARGET_APP=%~1"
if "%TARGET_APP%"=="" set "TARGET_APP=asteron-quote-apply"
set "VIEWER_MODE=results"

set SERVER=%~dp0tools\docs-viewer\server.js

echo Starting RESULTS viewer for app: %TARGET_APP%
echo.
echo    Open your browser to:  http://localhost:4400
echo    (lands on the interactive dashboard; sidebar = each run's report.md)
echo.
echo    Leave this window open. Press Ctrl+C to stop.
echo ------------------------------------------------------------
echo.

"%NODE_EXE%" "%SERVER%"

echo.
echo Server stopped. Press any key to close this window.
pause >nul
