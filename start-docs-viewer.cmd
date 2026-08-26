@echo off
REM ============================================================
REM  Docs Viewer launcher
REM  Double-click this file to start the local documentation site.
REM  Then open http://localhost:4400 in your browser.
REM  Keep this window OPEN while you use it. Press Ctrl+C or close
REM  the window to stop the server.
REM
REM  (Uses the Node bundled with Kiro-Cli because npm/Node are not
REM   installed separately on this machine.)
REM ============================================================

set NODE_EXE=C:\Users\TOMGOO\AppData\Local\Kiro-Cli\node.exe
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
