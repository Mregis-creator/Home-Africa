@echo off
echo ========================================
echo   HOME AFRICA - Mobile Access Server
echo ========================================
echo.

REM Find IP address
echo Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo.
    echo Your IP Address: !IP!
    echo.
    goto :found
)

:found
echo ========================================
echo   Server Starting...
echo ========================================
echo.
echo Access from your phone:
echo   http://%IP%:8000
echo.
echo Make sure your phone is on the SAME Wi-Fi network!
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Python HTTP Server on port 8000...
    python -m http.server 8000
) else (
    echo Python not found. Trying Node.js...
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Starting Node.js HTTP Server on port 8000...
        npx http-server -p 8000 -o
    ) else (
        echo ERROR: Neither Python nor Node.js found!
        echo Please install Python or Node.js to run the server.
        pause
    )
)

