@echo off
title EduNexa - Starting...
color 0B
echo.
echo  =========================================
echo   EduNexa AI Education Platform
echo  =========================================
echo.

REM ── Kill any old processes on port 5000 and 5173 ──────────────────────────
echo [1/3] Freeing ports 5000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

REM ── Start Backend ──────────────────────────────────────────────────────────
echo [2/3] Starting Backend on http://localhost:5000 ...
start "EduNexa Backend" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 3 /nobreak >nul

REM ── Start Frontend ─────────────────────────────────────────────────────────
echo [3/3] Starting Frontend on http://localhost:5173 ...
start "EduNexa Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

REM ── Open Browser ───────────────────────────────────────────────────────────
echo.
echo  =========================================
echo   Both servers started!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo  =========================================
echo.
start "" "http://localhost:5173"

echo  Press any key to close this launcher window...
pause >nul
