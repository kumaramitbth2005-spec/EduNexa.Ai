@echo off
title EduNexa Launcher
color 0B
echo.
echo  =========================================
echo    EduNexa AI Education Platform Launcher
echo  =========================================
echo.

echo  [1/3] Clearing ports 5000, 5173, and 5174...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5174 "') do taskkill /F /PID %%a >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo  [2/3] Starting Backend and Frontend...
start "EduNexa System" cmd /k "cd /d %~dp0 && npm run dev"

ping 127.0.0.1 -n 6 >nul

echo  [3/3] Opening browser...
start "" "http://localhost:5173"

echo.
echo  =========================================
echo   EduNexa is now running!
echo   Local App: http://localhost:5173
echo  =========================================
echo.
