@echo off
title EduNexa - Stopping...
color 0C
echo.
echo  Stopping EduNexa servers...
echo.

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 "') do (
    echo  Killing process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 "') do (
    echo  Killing process on port 5173 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo  All EduNexa servers stopped.
timeout /t 2 /nobreak >nul
