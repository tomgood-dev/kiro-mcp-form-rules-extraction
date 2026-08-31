@echo off
REM ============================================================
REM  Docs Viewer launcher
REM  Double-click this file to start the local documentation site.
REM  Then open http://localhost:4400 in your browser.
REM  Keep this window OPEN while you use it. Press Ctrl+C or close
REM  the window to stop the server.
REM
REM  Node resolution (works across machines/accounts):
REM   1) node on PATH, if installed normally.
REM   2) Kiro-Cli's bundled node.exe, for machines where npm/Node
REM      aren't installed separately (falls back per-user via %LOCALAPPDATA%,
REM      not a hardcoded machine-specific path).
REM ============================================================

setlocal

where node >nul 2>nul
if %ERRORLEVEL%==0 (
    set "NODE_EXE=node"
) else if exist "%LOCALAPPDATA%\Kiro-Cli\node.exe" (
    set "NODE_EXE=%LOCALAPPDATA%\Kiro-Cli\node.exe"
) else (
    echo ERROR: Could not find Node.js.
    echo   - Install Node.js from https://nodejs.org and ensure it's on PATH, or
    echo   - Ensure Kiro-Cli's bundled node.exe exists under %%LOCALAPPDATA%%\Kiro-Cli\
    pause
    exit /b 1
)

set SERVER=%~dp0tools\docs-viewer\server.js

echo Starting docs viewer...
echo.
echo    Open your browser to:  http://localhost:4400
echo.
echo    Leave this window open. Press Ctrl+C to stop.
echo ------------------------------------------------------------
echo.

"%NODE_EXE%" "%SERVER%"

echo.
echo Server stopped. Press any key to close this window.
pause >nul
